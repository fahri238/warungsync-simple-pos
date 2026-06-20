import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getCart, saveCart, getDeliverySettings, getSession } from "@/lib/store";
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
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import type { FulfillmentType, PaymentMethod } from "@/types";
import { createOrder } from "@/services/orderService";

const DEFAULT_CENTER: [number, number] = [-3.316694, 114.590111]; // Banjarmasin

const StoreCheckout = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  if (!storeId) {
    return <Navigate to="/stores" replace />;
  }

  const cart = getCart(storeId);
  const delivery = getDeliverySettings();
  const session = getSession() as any; // Cast as any jika tipe session belum memiliki latitude/longitude
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const [name, setName] = useState(session?.name || "");
  const [phone, setPhone] = useState(session?.phone || "");
  const [address, setAddress] = useState(session?.address || "");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [village, setVillage] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  
  // Ambil lokasi dari session jika ada, jika tidak null
  const [latitude, setLatitude] = useState<number | null>(session?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(session?.longitude ?? null);
  
  // Kamera peta menyesuaikan dengan lokasi yang tersimpan atau default
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    session?.latitude && session?.longitude 
      ? [session.latitude, session.longitude] 
      : DEFAULT_CENTER
  );

  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    fetchShippingRates(storeId).then(setRates).catch(() => {});
  }, [storeId]);

  useEffect(() => {
    fetchShippingRates(storeId)
      .then(setRates)
      .catch(() => {
        // Mock data if backend is offline
        setRates([
          { id: "v-1", storeId : "001", villageName: "Banjarmasin Tengah", rate: 5000 },
          { id: "v-2",storeId : '002', villageName: "Banjarmasin Barat", rate: 8000 },
          { id: "v-3",storeId : '003', villageName: "Banjarmasin Utara", rate: 10000 },
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
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          setMapCenter([lat, lng]);
          setIsLocating(false);
          toast.success("Lokasi diperbarui ke posisi Anda saat ini");
        },
        () => {
          setIsLocating(false);
          toast.error("Gagal mendapatkan lokasi GPS");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Isi nama dan nomor HP");
      return;
    }
    if (fulfillment === "delivery") {
      if (!address.trim()) {
        toast.error("Isi alamat pengiriman");
        return;
      }
      // if (!village) {
      //   toast.error("Pilih desa/kelurahan untuk ongkir");
      //   return;
      // }
      if (latitude == null || longitude == null) {
        toast.error("Tandai lokasi pengiriman di peta");
        return;
      }
    }
    if (payment === "transfer" && !transferProof) {
      toast.error("Unggah bukti transfer untuk pembayaran manual");
      return;
    }
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    try {
      setSubmitting(true);
      await createOrder({
        userId: session?.id,
        storeId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryAddress:
          fulfillment === "delivery"
            ? `${address.trim()} (Desa: ${village})`
            : undefined,
        shippingFee,
        latitude,
        longitude,
        type: "online",
        fulfillment,
        paymentMethod: payment,
        status: "pending",
        items: cart,
      });
      saveCart(storeId, []);
      toast.success("Pesanan berhasil dibuat!");
      navigate(`/store/${storeId}/orders`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal membuat pesanan";
      toast.error(message);
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
          <h2 className="text-xl font-bold">Keranjang Anda Kosong</h2>
          <p className="text-muted-foreground">Pilih produk favorit Anda terlebih dahulu.</p>
          <Button className="mt-2" asChild>
            <Link to={`/store/${storeId}`}>Mulai Belanja</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4 max-w-6xl">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" asChild>
            <Link to={`/store/${storeId}/cart`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-none">Checkout Pesanan</h1>
            <p className="text-xs text-muted-foreground mt-1">Selesaikan pembayaran Anda</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI: Form Pengisian */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* 1. Informasi Kontak */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-foreground flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" /> Informasi Kontak
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Penerima</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Nama lengkap" 
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>No. WhatsApp / HP</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="08xxxxxxxxxx" 
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Metode Pengiriman */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-foreground flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" /> Metode Pengiriman
              </h3>
              <RadioGroup 
                value={fulfillment} 
                onValueChange={(v) => setFulfillment(v as FulfillmentType)}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                  <Label
                    htmlFor="pickup"
                    className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted bg-transparent hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary"><Store className="h-5 w-5" /></div>
                      <span className="font-bold text-base">Ambil Sendiri</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Datang ke toko untuk mengambil pesanan. (Gratis)</span>
                  </Label>
                </div>

                {delivery.enabled && (
                  <div>
                    <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                    <Label
                      htmlFor="delivery"
                      className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted bg-transparent hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Truck className="h-5 w-5" /></div>
                        <span className="font-bold text-base">Diantar Kurir</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Pesanan akan diantar langsung ke rumah Anda.</span>
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {/* 2.b Detail Alamat (Hanya Muncul Jika Delivery) */}
              {fulfillment === "delivery" && (
                <div className="mt-6 pt-6 border-t space-y-5 animate-in fade-in slide-in-from-top-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Desa / Kelurahan</Label>
                      <Select value={village} onValueChange={setVillage}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih area pengiriman" />
                        </SelectTrigger>
                        <SelectContent>
                          {rates.map((r) => (
                            <SelectItem key={r.id} value={r.villageName}>
                              {r.villageName} — Rp {r.rate.toLocaleString("id-ID")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Lengkap</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Nama jalan, RT/RW, no rumah..."
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" /> Tandai Titik Peta
                      </Label>
                      <Button type="button" variant="ghost" size="sm" onClick={handleAutoLocate} disabled={isLocating} className="text-primary h-8 px-2">
                        <Crosshair className={`h-4 w-4 mr-1 ${isLocating ? "animate-spin" : ""}`} /> 
                        {isLocating ? "Melacak..." : "Lacak Posisi"}
                      </Button>
                    </div>
                    
                    <div className="rounded-xl overflow-hidden border shadow-sm relative">
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
                      {/* Indikator lokasi sudah diisi dari profil */}
                      {latitude != null && longitude != null && session?.latitude === latitude && (
                        <div className="absolute top-3 left-3 z-[400] bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                          Titik otomatis dari profil Anda
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Metode Pembayaran */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-foreground flex items-center gap-2 text-lg">
                <Banknote className="h-5 w-5 text-primary" /> Metode Pembayaran
              </h3>
              <RadioGroup 
                value={payment} 
                onValueChange={(v) => setPayment(v as PaymentMethod)}
                className="grid sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                  <Label
                    htmlFor="cash"
                    className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted bg-transparent hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Banknote className="h-5 w-5 text-primary" />
                      <span className="font-bold text-base">Bayar di Tempat</span>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">Cash on Delivery (COD).</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                  <Label
                    htmlFor="transfer"
                    className="flex cursor-pointer flex-col p-4 rounded-xl border-2 border-muted bg-transparent hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-bold text-base">Transfer Bank</span>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">Upload bukti transfer manual.</span>
                  </Label>
                </div>
              </RadioGroup>

              {payment === "transfer" && (
                <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                  {/* Kotak Informasi Rekening */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-primary">Transfer ke Rekening Berikut:</p>
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 shadow-sm">
                      <div>
                        <p className="font-bold text-foreground tracking-wide">BCA • 1234 5678 90</p>
                        <p className="text-xs text-muted-foreground mt-0.5">a.n. WarungSync Official</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20"
                        onClick={() => {
                          navigator.clipboard.writeText("1234567890");
                          toast.success("Nomor rekening berhasil disalin!");
                        }}
                      >
                        Salin No. Rek
                      </Button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Pastikan nominal transfer sama persis dengan <strong className="text-foreground">Total Tagihan</strong> agar pesanan lebih cepat diproses.
                    </p>
                  </div>

                  {/* Area Upload Bukti */}
                  <div className="p-5 bg-muted/30 rounded-xl border border-dashed border-border/80">
                    <Label className="flex items-center gap-2 mb-3 font-semibold">
                      <Receipt className="h-4 w-4 text-muted-foreground" /> Unggah Bukti Transfer
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTransferProof(e.target.files?.[0] || null)}
                      className="bg-background file:text-primary file:font-semibold cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Bukti disimpan sementara di perangkat Anda (Format JPG/PNG).
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* KOLOM KANAN: Ringkasan Pesanan (Sticky) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5 sticky top-24">
              <h3 className="mb-4 font-bold text-foreground text-lg border-b pb-4">Ringkasan Belanja</h3>
              
              <div className="space-y-3 mb-6 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                {cart.map((i) => (
                  <div key={i.product.id} className="flex gap-3 text-sm">
                    {/* Placeholder image (opsional) */}
                    <div className="h-12 w-12 rounded-md bg-secondary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {i.product.image ? (
                         <img src={i.product.image} alt={i.product.name} className="h-full w-full object-cover" />
                      ) : (
                         <ShoppingBag className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground line-clamp-1">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">Rp {i.product.price.toLocaleString("id-ID")} x {i.quantity}</p>
                    </div>
                    <span className="font-bold text-foreground self-center">
                      Rp {(i.product.price * i.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm border-t pt-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal Belanja</span>
                  <span className="font-medium text-foreground">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                
                {fulfillment === "delivery" && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Ongkos Kirim {village ? `(${village})` : ""}</span>
                    <span className="font-medium text-foreground">
                      {shippingFee > 0 ? `Rp ${shippingFee.toLocaleString("id-ID")}` : "-"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 p-4 border border-primary/20">
                <span className="font-bold text-primary">Total Tagihan</span>
                <span className="text-xl font-black text-primary">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>

              <Button 
                className="w-full h-12 text-base mt-6 shadow-md shadow-primary/20" 
                onClick={handleOrder} 
                disabled={submitting}
              >
                {submitting ? (
                   "Memproses Pesanan..."
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

export default StoreCheckout;