import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession, setSession, getOrders } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, LogOut, User, BarChart3, Heart, DollarSign } from "lucide-react";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const allOrders = useMemo(() => {
    if (!session || session.role !== "customer") return [];
    return getOrders().filter(o => o.type === "online");
  }, [session]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [allOrders, dateFrom, dateTo]);

  const totalSpending = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === "completed").length;

  const monthlySpending: Record<string, { month: string; total: number; count: number }> = {};
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
    if (!monthlySpending[key]) monthlySpending[key] = { month: label, total: 0, count: 0 };
    monthlySpending[key].total += o.total;
    monthlySpending[key].count += 1;
  });
  const monthlyData = Object.values(monthlySpending).reverse();

  const productFreq: Record<string, { name: string; qty: number; spent: number }> = {};
  filteredOrders.forEach(o => o.items.forEach(i => {
    if (!productFreq[i.product.id]) productFreq[i.product.id] = { name: i.product.name, qty: 0, spent: 0 };
    productFreq[i.product.id].qty += i.quantity;
    productFreq[i.product.id].spent += i.product.price * i.quantity;
  }));
  const favoriteProducts = Object.values(productFreq).sort((a, b) => b.qty - a.qty);

  const handleLogout = () => {
    setSession(null);
    navigate("/");
  };

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

  const allOrders = getOrders().filter(o => o.type === "online");

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [allOrders, dateFrom, dateTo]);

  // Customer report data
  const totalSpending = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === "completed").length;

  // Monthly spending breakdown
  const monthlySpending: Record<string, { month: string; total: number; count: number }> = {};
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
    if (!monthlySpending[key]) monthlySpending[key] = { month: label, total: 0, count: 0 };
    monthlySpending[key].total += o.total;
    monthlySpending[key].count += 1;
  });
  const monthlyData = Object.values(monthlySpending).reverse();

  // Favorite products
  const productFreq: Record<string, { name: string; qty: number; spent: number }> = {};
  filteredOrders.forEach(o => o.items.forEach(i => {
    if (!productFreq[i.product.id]) productFreq[i.product.id] = { name: i.product.name, qty: 0, spent: 0 };
    productFreq[i.product.id].qty += i.quantity;
    productFreq[i.product.id].spent += i.product.price * i.quantity;
  }));
  const favoriteProducts = Object.values(productFreq).sort((a, b) => b.qty - a.qty);

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

      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6 animate-slide-in">
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
            {allOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
            ) : (
              <div className="space-y-3">
                {allOrders.slice(0, 5).map(o => (
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

        {/* Reports Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5" />Laporan Saya</h2>
          
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div><Label>Dari</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label>Sampai</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Total Belanja</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><p className="text-xl font-bold text-foreground">Rp {totalSpending.toLocaleString("id-ID")}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Total Pesanan</CardTitle>
                <Package className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent><p className="text-xl font-bold text-foreground">{totalOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Selesai</CardTitle>
                <Heart className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent><p className="text-xl font-bold text-foreground">{completedOrders}</p></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="history" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">Riwayat Pesanan</TabsTrigger>
              <TabsTrigger value="spending">Pengeluaran</TabsTrigger>
              <TabsTrigger value="favorites">Favorit</TabsTrigger>
            </TabsList>

            {/* 1. Order History Report */}
            <TabsContent value="history">
              <Card>
                <CardHeader><CardTitle className="text-base">📋 Riwayat Pesanan</CardTitle></CardHeader>
                <CardContent>
                  {filteredOrders.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pesanan.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b">
                          <th className="px-3 py-2 text-left text-muted-foreground">Tanggal</th>
                          <th className="px-3 py-2 text-left text-muted-foreground">Item</th>
                          <th className="px-3 py-2 text-center text-muted-foreground">Status</th>
                          <th className="px-3 py-2 text-right text-muted-foreground">Total</th>
                        </tr></thead>
                        <tbody>{filteredOrders.map(o => (
                          <tr key={o.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-foreground text-xs">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2 text-foreground text-xs">{o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">Rp {o.total.toLocaleString("id-ID")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. Spending Report */}
            <TabsContent value="spending">
              <Card>
                <CardHeader><CardTitle className="text-base">💰 Laporan Pengeluaran</CardTitle></CardHeader>
                <CardContent>
                  {monthlyData.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b">
                          <th className="px-3 py-2 text-left text-muted-foreground">Bulan</th>
                          <th className="px-3 py-2 text-center text-muted-foreground">Pesanan</th>
                          <th className="px-3 py-2 text-right text-muted-foreground">Total Belanja</th>
                        </tr></thead>
                        <tbody>{monthlyData.map(m => (
                          <tr key={m.month} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium text-foreground">{m.month}</td>
                            <td className="px-3 py-2 text-center">{m.count}</td>
                            <td className="px-3 py-2 text-right font-mono">Rp {m.total.toLocaleString("id-ID")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                      <div className="mt-4 rounded-lg bg-primary/10 p-3 flex justify-between">
                        <span className="font-semibold text-foreground">Total Keseluruhan</span>
                        <span className="font-bold text-primary">Rp {totalSpending.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. Favorite Products Report */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader><CardTitle className="text-base">❤️ Produk Favorit</CardTitle></CardHeader>
                <CardContent>
                  {favoriteProducts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b">
                          <th className="px-3 py-2 text-left text-muted-foreground">#</th>
                          <th className="px-3 py-2 text-left text-muted-foreground">Produk</th>
                          <th className="px-3 py-2 text-center text-muted-foreground">Dipesan</th>
                          <th className="px-3 py-2 text-right text-muted-foreground">Total Belanja</th>
                        </tr></thead>
                        <tbody>{favoriteProducts.map((p, i) => (
                          <tr key={p.name} className="border-b last:border-0">
                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                            <td className="px-3 py-2 text-center">{p.qty}x</td>
                            <td className="px-3 py-2 text-right font-mono">Rp {p.spent.toLocaleString("id-ID")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
