import { Link, useNavigate } from "react-router-dom";
import { getSession, setSession, getOrders } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Package, LogOut, User } from "lucide-react";
import type { OrderStatus } from "@/types";

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

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();

  if (!session || session.role !== "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <p className="mb-4 text-muted-foreground">Silakan login terlebih dahulu</p>
            <Button asChild><Link to="/login">Masuk</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = getOrders().filter(o => o.type === "online");

  const handleLogout = () => {
    setSession(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <span className="font-bold text-foreground">WarungSync</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6 animate-slide-in">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" />Profil Saya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium text-foreground">{session.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{session.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">No. HP</span><span className="font-medium text-foreground">{session.phone}</span></div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button className="h-20 flex-col gap-2" asChild>
            <Link to="/store"><ShoppingBag className="h-6 w-6" />Belanja</Link>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            <Link to="/store/orders"><Package className="h-6 w-6" />Pesanan Saya</Link>
          </Button>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pesanan Terakhir</CardTitle></CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                    <div>
                      <p className="text-sm text-foreground">{o.items.map(i => i.product.name).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>
                        {statusLabels[o.status]}
                      </span>
                      <p className="mt-1 text-sm font-bold text-primary">Rp {o.total.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;
