import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getCart,
  saveCart,
  getDeliverySettings,
  getSession,
  updateStock,
  apiFetch,
} from "@/lib/store";
import { fetchShippingRates } from "@/services/storeService";
import type { ShippingRate } from "@/types";
import DeliveryLocationPicker from "@/components/maps/DeliveryLocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Check,
  MapPin,
  User,
  Phone,
  Store,
  Truck,
  Banknote,
  CreditCard,
  Crosshair,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import type { FulfillmentType, PaymentMethod } from "@/types";

const DEFAULT_CENTER: [number, number] = [-3.316694, 114.590111];

const CustomerCheckout = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  if (!storeId) return <Navigate to="/customer/stores" replace />;

  const cart = getCart(storeId);
  const delivery = getDeliverySettings();
  const session = getSession() as any;
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const [name, setName] = useState(session?.name || session?.nama || "");
  const [phone, setPhone] = useState(session?.phone || session?.kontak || "");
  const [address, setAddress] = useState(
    session?.address || session?.alamat || "",
  );
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [village, setVillage] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);

  // State untuk Rekening Bank Dinamis
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [latitude, setLatitude] = useState<number | null>(
    session?.latitude ?? null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    session?.longitude ?? null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    session?.latitude ? [session.latitude, session.longitude] : DEFAULT_CENTER,
  );

  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!session?.latitude || !session?.longitude) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLatitude(pos.coords.latitude);
            setLongitude(pos.coords.longitude);
            setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          },
          () => {},
          { enableHighAccuracy: true },
        );
      }
    }
  }, []);

  useEffect(() => {
    fetchShippingRates(storeId)
      .then(setRates)
      .catch(() => setRates([]));

    // Fetch Daftar Rekening Bank Toko
    apiFetch(`/stores/${storeId}/banks`)
      .then((res) => setBankAccounts(res.data || []))
      .catch(() => {
        // Fallback jika API backend belum dibuat
        setBankAccounts([
          {
            bank_name: "BCA",
            account_number: "1234567890",
            account_name: "Toko Default",
          },
        ]);
      });
  }, [storeId]);

  const shippingFee =
    fulfillment === "delivery"
      ? rates.find((r) => r.villageName === village)?.rate || 0
      : 0;
  const total = subtotal + shippingFee;

  const handleAutoLocate = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setIsLocating(false);
          toast.success("Lokasi diperbarui");
        },
        () => {
          setIsLocating(false);
          toast.error("Gagal mendapat GPS");
        },
        { enableHighAccuracy: true },
      );
    }
  };

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim()) { toast.error("Isi nama dan nomor HP"); return; }
    if (fulfillment === "delivery") {
      if (!village) { toast.error("Pilih area pengiriman"); return; }
      if (!address.trim()) { toast.error("Isi alamat pengiriman lengkap"); return; }
      if (latitude == null || longitude == null) { toast.error("Tandai lokasi pengiriman di peta"); return; }
    }
    if (payment === "transfer" && !transferProof) { toast.error("Unggah bukti transfer untuk pembayaran manual"); return; }
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append("id_pengguna", session?.id?.toString() || "");
      formData.append("storeId", storeId);
      formData.append("customerName", name.trim());
      formData.append("customerPhone", phone.trim());
      formData.append("tipe_pesanan", "online");
      formData.append("tipe_pengiriman", fulfillment === "delivery" ? "kurir" : "pickup");
      formData.append("metode_pembayaran", payment === "cash" ? "tunai" : "transfer");
      
      if (fulfillment === "delivery") {
        formData.append("alamat_pengiriman", `${address.trim()} (Area: ${village})`);
        formData.append("latitude", latitude!.toString());
        formData.append("longitude", longitude!.toString());
      }
      
      formData.append("items", JSON.stringify(cart));
      
      if (payment === "transfer" && transferProof) {
        formData.append("bukti_transfer", transferProof);
      }

      // PERBAIKAN: Menggunakan apiFetch bawaan Anda
      // Karena isinya FormData, apiFetch akan otomatis mengenali dan memproses file-nya
      const response = await apiFetch("/orders", {
        method: "POST",
        body: formData
      });

      if (!response.success) {
         throw new Error(response.message || "Gagal membuat pesanan");
      }

      updateStock(cart);
      saveCart(storeId, []);
      toast.success("Pesanan berhasil dibuat!");
      navigate(`/customer/store/${storeId}/orders`);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem saat memproses pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold">Keranjang Kosong</h2>
          <Button className="mt-2" asChild>
            <Link to={`/customer/store/${storeId}`}>Mulai Belanja</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 pb-20">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4 max-w-6xl">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            asChild
          >
            <Link to={`/customer/store/${storeId}/cart`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-none">
              Checkout Pesanan
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Selesaikan pembayaran Anda
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Informasi Kontak
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Penerima</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. WhatsApp / HP</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Metode Pengiriman
              </h3>
              <RadioGroup
                value={fulfillment}
                onValueChange={(v) => setFulfillment(v as FulfillmentType)}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="pickup"
                    id="pickup"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="pickup"
                    className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Store className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-base">Ambil Sendiri</span>
                    </div>
                  </Label>
                </div>
                {delivery.enabled && (
                  <div>
                    <RadioGroupItem
                      value="delivery"
                      id="delivery"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="delivery"
                      className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Truck className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-base">
                          Diantar Kurir
                        </span>
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {fulfillment === "delivery" && (
                <div className="mt-6 pt-6 border-t space-y-5 animate-in fade-in">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Desa / Kelurahan Area{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select value={village} onValueChange={setVillage}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih area pengiriman" />
                        </SelectTrigger>
                        <SelectContent>
                          {rates.map((r) => (
                            <SelectItem key={r.id} value={r.villageName}>
                              {r.villageName} — Rp{" "}
                              {r.rate.toLocaleString("id-ID")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Alamat Lengkap{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" /> Tandai Titik
                        Peta
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAutoLocate}
                        disabled={isLocating}
                        className="text-primary"
                      >
                        <Crosshair
                          className={`h-4 w-4 mr-1 ${isLocating ? "animate-spin" : ""}`}
                        />{" "}
                        Lacak Posisi
                      </Button>
                    </div>
                    <div className="rounded-xl overflow-hidden border shadow-sm">
                      <DeliveryLocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        mapCenter={mapCenter}
                        onChange={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                        height="300px"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" /> Metode Pembayaran
              </h3>
              <RadioGroup
                value={payment}
                onValueChange={(v) => setPayment(v as PaymentMethod)}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="cash"
                    id="cash"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="cash"
                    className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-primary" />
                      <span className="font-bold text-base">
                        Bayar di Tempat
                      </span>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="transfer"
                    id="transfer"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="transfer"
                    className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-bold text-base">Transfer Bank</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {payment === "transfer" && (
                <div className="mt-5 space-y-4 animate-in fade-in">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-primary">
                      Transfer ke Salah Satu Rekening Berikut:
                    </p>
                    <div className="grid gap-3">
                      {bankAccounts.map((bank, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-foreground tracking-wide">
                              {bank.bank_name} • {bank.account_number}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              a.n. {bank.account_name}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs font-semibold text-primary"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                bank.account_number,
                              );
                              toast.success("Nomor rekening disalin!");
                            }}
                          >
                            Salin
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-muted/30 rounded-xl border border-dashed border-border/80">
                    <Label className="flex items-center gap-2 mb-3 font-semibold">
                      <Receipt className="h-4 w-4 text-muted-foreground" />{" "}
                      Unggah Bukti Transfer
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setTransferProof(e.target.files?.[0] || null)
                      }
                      className="bg-background cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5 sticky top-24">
              <h3 className="mb-4 font-bold text-lg border-b pb-4">
                Ringkasan Belanja
              </h3>
              <div className="space-y-3 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                {fulfillment === "delivery" && (
                  <div className="flex justify-between">
                    <span>Ongkir</span>
                    <span className="font-medium">
                      {shippingFee > 0
                        ? `Rp ${shippingFee.toLocaleString("id-ID")}`
                        : "-"}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between rounded-xl bg-primary/10 p-4 border border-primary/20">
                <span className="font-bold text-primary">Total Tagihan</span>
                <span className="text-xl font-black text-primary">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>
              <Button
                className="w-full h-12 text-base mt-6 shadow-md"
                onClick={handleOrder}
                disabled={submitting}
              >
                {submitting ? (
                  "Memproses..."
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" /> Pesan Sekarang
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCheckout;
