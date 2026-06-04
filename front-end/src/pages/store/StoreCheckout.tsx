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
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import type { FulfillmentType, PaymentMethod } from "@/types";
import { createOrder } from "@/services/orderService";

const StoreCheckout = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  if (!storeId) {
    return <Navigate to="/stores" replace />;
  }

  const cart = getCart(storeId);
  const delivery = getDeliverySettings();
  const session = getSession();
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const [name, setName] = useState(session?.name || "");
  const [phone, setPhone] = useState(session?.phone || "");
  const [address, setAddress] = useState(session?.address || "");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [village, setVillage] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShippingRates(storeId).then(setRates).catch(() => {});
  }, [storeId]);

  const shippingFee =
    fulfillment === "delivery"
      ? rates.find((r) => r.villageName === village)?.rate || 0
      : 0;
  const total = subtotal + shippingFee;

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
      if (!village) {
        toast.error("Pilih desa/kelurahan untuk ongkir");
        return;
      }
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
        <div className="text-center">
          <p className="text-muted-foreground">Keranjang kosong</p>
          <Button className="mt-4" asChild>
            <Link to={`/store/${storeId}`}>Belanja</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/store/${storeId}/cart`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-bold text-foreground">Checkout</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-lg space-y-6 px-4 py-6">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-semibold text-foreground">Ringkasan Pesanan</h3>
          {cart.map((i) => (
            <div key={i.product.id} className="flex items-center justify-between py-1 text-sm">
              <span className="text-foreground">
                {i.product.name} x{i.quantity}
              </span>
              <span className="font-medium text-foreground">
                Rp {(i.product.price * i.quantity).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
          {fulfillment === "delivery" && shippingFee > 0 && (
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-muted-foreground">Ongkir ({village})</span>
              <span>Rp {shippingFee.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
          </div>
          <div>
            <Label>No. HP</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Metode Pengambilan</Label>
          <RadioGroup value={fulfillment} onValueChange={(v) => setFulfillment(v as FulfillmentType)}>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="cursor-pointer">
                Ambil Sendiri (Pickup) — Gratis
              </Label>
            </div>
            {delivery.enabled && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="cursor-pointer">
                  Diantar (Delivery)
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>

        {fulfillment === "delivery" && (
          <>
            <div>
              <Label>Desa / Kelurahan (tarif ongkir tetap)</Label>
              <Select value={village} onValueChange={setVillage}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih desa" />
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
            <div>
              <Label>Alamat Pengiriman</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat lengkap"
              />
            </div>
            <DeliveryLocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </>
        )}

        <div>
          <Label className="mb-2 block">Metode Pembayaran</Label>
          <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer">
                Cash on Delivery (COD)
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem value="transfer" id="transfer" />
              <Label htmlFor="transfer" className="cursor-pointer">
                Transfer Manual (Bank)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {payment === "transfer" && (
          <div>
            <Label>Bukti Transfer</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setTransferProof(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Bukti disimpan sementara di perangkat Anda (tanpa gateway pembayaran pihak ketiga).
            </p>
          </div>
        )}

        <Button className="w-full gap-2" size="lg" onClick={handleOrder} disabled={submitting}>
          <Check className="h-4 w-4" />
          {submitting ? "Memproses..." : "Pesan Sekarang"}
        </Button>
      </div>
    </div>
  );
};

export default StoreCheckout;
