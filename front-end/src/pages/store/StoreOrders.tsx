<<<<<<< HEAD
import { Link } from "react-router-dom";
import { getOrders } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import type { OrderStatus } from "@/types";
=======
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { fetchOrders } from "@/services/orderService";
import { toast } from "sonner";
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Diantar", completed: "Selesai"
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-info/10 text-info",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-secondary/80 text-secondary-foreground",
  completed: "bg-primary/10 text-primary",
};

const StoreOrders = () => {
<<<<<<< HEAD
  const orders = getOrders().filter(o => o.type === "online");
=======
  const session = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    fetchOrders({
      userId: session.id,
      type: "online",
    })
      .then((rows) => setOrders(rows))
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat pesanan");
      })
      .finally(() => setLoading(false));
  }, [session?.id]);
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" asChild><Link to="/store"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="font-bold text-foreground">Pesanan Saya</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6">
<<<<<<< HEAD
        {orders.length === 0 ? (
=======
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Memuat pesanan...</div>
        ) : orders.length === 0 ? (
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada pesanan</p>
            <Button className="mt-4" asChild><Link to="/store">Mulai Belanja</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("id-ID")}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>
                    {statusLabels[o.status]}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {o.items.map(i => (
                    <p key={i.product.id} className="text-sm text-foreground">{i.product.image} {i.product.name} x{i.quantity}</p>
                  ))}
                </div>
                <div className="mt-2 border-t pt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{o.fulfillment === "delivery" ? "Delivery" : "Pickup"}</span>
                  <span className="font-bold text-primary">Rp {o.total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOrders;
