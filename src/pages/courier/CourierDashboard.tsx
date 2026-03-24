import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession, setSession, getOrders, updateOrder } from "@/lib/store";
import type { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Truck, MapPin, Package, Phone } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Diantar", completed: "Selesai"
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-info/10 text-info",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-accent/10 text-accent",
  completed: "bg-primary/10 text-primary",
};

const CourierDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [orders, setOrders] = useState(() => getOrders().filter(o => o.fulfillment === "delivery" && ["ready", "delivering"].includes(o.status)));

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
    setSession(null);
    navigate("/");
  };

  const handleUpdateStatus = (order: Order, status: OrderStatus) => {
    const updated = { ...order, status, courierId: session.id };
    updateOrder(updated);
    setOrders(getOrders().filter(o => o.fulfillment === "delivery" && ["ready", "delivering"].includes(o.status)));
    toast.success(status === "completed" ? "Pengiriman selesai!" : "Status diperbarui");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-secondary">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-secondary-foreground" />
            <span className="font-bold text-secondary-foreground">Kurir Panel</span>
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
        <h2 className="text-xl font-bold text-foreground">Pengiriman Aktif ({orders.length})</h2>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Tidak ada pengiriman saat ini</p>
            </CardContent>
          </Card>
        ) : (
          orders.map(o => (
            <Card key={o.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{o.customerName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>
                    {statusLabels[o.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />{o.customerPhone}
                  </div>
                  {o.customerAddress && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5" />{o.customerAddress}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Item Pesanan:</p>
                  {o.items.map(i => (
                    <p key={i.product.id} className="text-sm text-foreground">{i.product.name} x{i.quantity}</p>
                  ))}
                  <p className="mt-2 text-sm font-bold text-primary">Total: Rp {o.total.toLocaleString("id-ID")}</p>
                </div>

                <div className="flex gap-2">
                  {o.status === "ready" && (
                    <Button className="flex-1 gap-2" onClick={() => handleUpdateStatus(o, "delivering")}>
                      <Truck className="h-4 w-4" />Mulai Antar
                    </Button>
                  )}
                  {o.status === "delivering" && (
                    <Button className="flex-1 gap-2" onClick={() => handleUpdateStatus(o, "completed")}>
                      <Package className="h-4 w-4" />Selesai
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CourierDashboard;
