import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { getSession } from "@/lib/store";
import type { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Truck, MapPin, Package, Phone, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, updateOrderStatus } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { completeDelivery } from "@/services/deliveryService";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Diantar", completed: "Selesai"
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-blue-500/10 text-blue-600",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-orange-500/10 text-orange-600",
  completed: "bg-primary/10 text-primary",
};

const CourierDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!session || session.role !== "courier") {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    fetchOrders({ type: "online" })
      .then((rows) => {
        const mine = rows.filter((o: Order) => o.courierId === session.id && o.fulfillment === "delivery");
        setOrders(mine);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat data kurir");
      })
      .finally(() => setLoadingOrders(false));
  }, [session]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === "delivering"),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "completed"),
    [orders],
  );

  if (!session || session.role !== "courier") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <p className="mb-4 text-muted-foreground">Login sebagai kurir untuk mengakses</p>
            <Button asChild><Link to="/login">Masuk</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCompleteDelivery = async (order: Order) => {
    try {
      if (order.deliveryId) {
        await completeDelivery(order.deliveryId);
      } else {
        await updateOrderStatus(order.id, { status: "completed" });
      }
      const rows = await fetchOrders({ type: "online" });
      const mine = rows.filter((o: Order) => o.courierId === session.id && o.fulfillment === "delivery");
      setOrders(mine);
      toast.success("Pengiriman selesai!");
    } catch (error: any) {
      toast.error(error?.message || "Gagal memperbarui pengiriman");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-secondary">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary/80" asChild>
              <Link to="/login"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <WarungSyncLogo
              size="sm"
              className="[&_span]:text-secondary-foreground [&_span:last-child]:text-secondary-foreground/65"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary-foreground/80">{session.name}</span>
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary/80" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4 animate-slide-in">
        {/* Courier Profile */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" />Profil Kurir</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium text-foreground">{session.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{session.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">No. HP</span><span className="font-medium text-foreground">{session.phone}</span></div>
            {session.address && <div className="flex justify-between"><span className="text-muted-foreground">Alamat</span><span className="font-medium text-foreground">{session.address}</span></div>}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{activeOrders.length}</p>
              <p className="text-xs text-muted-foreground">Pengiriman Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{completedOrders.length}</p>
              <p className="text-xs text-muted-foreground">Selesai</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold text-foreground">Pengiriman Aktif ({activeOrders.length})</h2>

        {loadingOrders ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Memuat pengiriman...
            </CardContent>
          </Card>
        ) : activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Tidak ada pengiriman saat ini</p>
            </CardContent>
          </Card>
        ) : (
          activeOrders.map(o => (
            <Card key={o.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{o.customerName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>
                    {statusLabels[o.status]}
                  </span>
                </div>

                {/* Customer contact details */}
                <div className="space-y-1 text-sm rounded-lg border p-3 bg-muted/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">📞 Kontak Pelanggan</p>
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-3 w-3 text-muted-foreground" />{o.customerPhone}
                  </div>
                  {o.customerAddress && (
                    <div className="flex items-start gap-2 text-foreground">
                      <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />{o.customerAddress}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">📦 Item Pesanan:</p>
                  {o.items.map(i => (
                    <p key={i.product.id} className="text-sm text-foreground">{i.product.name} x{i.quantity}</p>
                  ))}
                  <p className="mt-2 text-sm font-bold text-primary">Total: Rp {o.total.toLocaleString("id-ID")}</p>
                </div>

                <Button className="w-full gap-2" onClick={() => handleCompleteDelivery(o)}>
                  <Package className="h-4 w-4" /> Pesanan Selesai
                </Button>
              </CardContent>
            </Card>
          ))
        )}

        {/* Completed deliveries */}
        {completedOrders.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-foreground mt-6">Riwayat Pengiriman ({completedOrders.length})</h2>
            {completedOrders.slice(0, 10).map(o => (
              <Card key={o.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">{o.customerName}</span>
                      <p className="text-xs text-muted-foreground">{o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Selesai</span>
                      <p className="mt-1 text-sm font-bold text-primary">Rp {o.total.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CourierDashboard;
