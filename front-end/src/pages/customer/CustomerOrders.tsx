import { useEffect, useState } from "react";
import { Link, useNavigate, Navigate, useParams } from "react-router-dom";
import { getSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { fetchOrders } from "@/services/orderService";
import { toast } from "sonner";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  ready: "Siap Ambil",
  delivering: "Diantar",
  completed: "Selesai",
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-info/10 text-info",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-secondary/80 text-secondary-foreground",
  completed: "bg-primary/10 text-primary",
};

const CustomerOrders = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const session = getSession();
  const navigate = useNavigate();

  if (!storeId) {
    // FIX ROUTE: Arahkan kembali ke pemilihan toko versi customer
    return <Navigate to="/customer/stores" replace />;
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // FIX 1: delete argumen fetchOrders and filter it manually
    fetchOrders()
      .then((rows) => {
        const myOrders = rows.filter(
          (o: Order) => (o as any).userId === session.id && o.type === "online",
        );
        setOrders(myOrders);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat pesanan");
      })
      .finally(() => setLoading(false));
  }, [session?.id]);

  // FIX 2: Calculator saver if value 'total' null
  const getOrderTotal = (order: Order) => {
    if (typeof order.total === "number") return order.total;
    const itemsTotal = (order.items || []).reduce(
      (sum, i) => sum + (i.product?.price || 0) * i.quantity,
      0,
    );
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          {/* FIX ROUTE: Kembali ke halaman toko versi customer */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bold text-foreground">Pesanan Saya</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            Memuat pesanan...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada pesanan</p>
            {/* FIX ROUTE: Mulai belanja ke halaman toko versi customer */}
            <Button className="mt-4" asChild>
              <Link to={`/customer/store/${storeId}`}>Mulai Belanja</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}
                  >
                    {statusLabels[o.status]}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {o.items.map((i) => (
                    <p key={i.product.id} className="text-sm text-foreground">
                      {i.product.name} x{i.quantity}
                    </p>
                  ))}
                </div>
                <div className="mt-2 border-t pt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {o.fulfillment === "delivery" || o.fulfillment === "kurir"
                      ? "Diantar Kurir"
                      : "Ambil Sendiri"}
                  </span>
                  <span className="font-bold text-primary">
                    Rp {getOrderTotal(o).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;
