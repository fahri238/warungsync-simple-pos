import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, saveCart, updateStock, addOrder, generateId, getDeliverySettings, getSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import type { FulfillmentType, PaymentMethod } from "@/types";

const StoreCheckout = () => {
  const navigate = useNavigate();
  const cart = getCart();
  const delivery = getDeliverySettings();
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const [name, setName] = useState(session?.name || "");
  const [phone, setPhone] = useState(session?.phone || "");
  const [address, setAddress] = useState(session?.address || "");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [payment, setPayment] = useState<PaymentMethod>("cash");

  const handleOrder = () => {
    if (!name.trim() || !phone.trim()) { toast.error("Isi nama dan nomor HP"); return; }
    if (fulfillment === "delivery" && !address.trim()) { toast.error("Isi alamat pengiriman"); return; }
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }

    updateStock(cart);
    addOrder({
      id: generateId(),
      items: cart,
      total,
      status: "pending",
      paymentMethod: payment,
      type: "online",
      fulfillment,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    saveCart([]);
    toast.success("Pesanan berhasil dibuat!");
    navigate("/store/orders");
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Keranjang kosong</p>
          <Button className="mt-4" asChild><Link to="/store">Belanja</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" asChild><Link to="/store/cart"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="font-bold text-foreground">Checkout</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Order Summary */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-semibold text-foreground">Ringkasan Pesanan</h3>
          {cart.map(i => (
            <div key={i.product.id} className="flex items-center justify-between py-1 text-sm">
              <span className="text-foreground">{i.product.image} {i.product.name} x{i.quantity}</span>
              <span className="font-medium text-foreground">Rp {(i.product.price * i.quantity).toLocaleString("id-ID")}</span>
            </div>
          ))}
          <div className="mt-3 border-t pt-3 flex items-center justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-3">
          <div><Label>Nama</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" /></div>
          <div><Label>No. HP</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
        </div>

        {/* Fulfillment */}
        <div>
          <Label className="mb-2 block">Metode Pengambilan</Label>
          <RadioGroup value={fulfillment} onValueChange={v => setFulfillment(v as FulfillmentType)}>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="cursor-pointer">Ambil Sendiri (Pickup)</Label>
            </div>
            {delivery.enabled && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="cursor-pointer">Diantar (Delivery)</Label>
              </div>
            )}
          </RadioGroup>
        </div>

        {fulfillment === "delivery" && (
          <div><Label>Alamat Pengiriman</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap" /></div>
        )}

        {/* Payment */}
        <div>
          <Label className="mb-2 block">Metode Pembayaran</Label>
          <RadioGroup value={payment} onValueChange={v => setPayment(v as PaymentMethod)}>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer">Bayar di Tempat (Cash)</Label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <RadioGroupItem value="transfer" id="transfer" />
              <Label htmlFor="transfer" className="cursor-pointer">Transfer Manual</Label>
            </div>
          </RadioGroup>
        </div>

        <Button className="w-full gap-2" size="lg" onClick={handleOrder}>
          <Check className="h-4 w-4" />
          Pesan Sekarang
        </Button>
      </div>
    </div>
  );
};

export default StoreCheckout;
