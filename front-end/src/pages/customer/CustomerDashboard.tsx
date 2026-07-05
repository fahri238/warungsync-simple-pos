import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { getSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, LogOut, User, BarChart3, Heart, DollarSign, ArrowLeft } from "lucide-react";
import PrintReportButton from "@/components/PrintReportButton";
import type { Order, OrderStatus } from "@/types";
import { fetchOrders } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
  const { logout } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // SOLUSI INFINITE LOOP: Ekstrak ID dan Role sebagai variabel primitif
  const sessionId = session?.id;
  const sessionRole = session?.role;

  useEffect(() => {
    // Gunakan variabel primitif untuk pengecekan
    if (!sessionId || sessionRole !== "customer") {
      setAllOrders([]);
      setLoadingOrders(false);
      return;
    }

    fetchOrders()
      .then((orders) => {
        // Filter menggunakan sessionId
        const myOnlineOrders = orders.filter((o: Order) => (o as any).userId === sessionId && o.type === "online");
        setAllOrders(myOnlineOrders);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat data pesanan");
      })
      .finally(() => setLoadingOrders(false));
      
  // Hanya jalankan useEffect jika ID atau Role berubah, bukan seluruh objek session
  }, [sessionId, sessionRole]);

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === 'number') return order.total;
    const itemsTotal = (order.items || []).reduce((sum, i) => sum + ((i.product?.price || 0) * i.quantity), 0);
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [allOrders, dateFrom, dateTo]);

  const totalSpending = filteredOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === "completed").length;

  const monthlySpending: Record<string, { month: string; total: number; count: number }> = {};
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
    if (!monthlySpending[key]) monthlySpending[key] = { month: label, total: 0, count: 0 };
    monthlySpending[key].total += getOrderTotal(o);
    monthlySpending[key].count += 1;
  });
  const monthlyData = Object.values(monthlySpending).reverse();

  const productFreq: Record<string, { name: string; qty: number; spent: number }> = {};
  filteredOrders.forEach(o => o.items.forEach(i => {
    if (!productFreq[i.product.id]) productFreq[i.product.id] = { name: i.product.name, qty: 0, spent: 0 };
    productFreq[i.product.id].qty += i.quantity;
    productFreq[i.product.id].spent += (i.product?.price || 0) * i.quantity;
  }));
  const favoriteProducts = Object.values(productFreq).sort((a, b) => b.qty - a.qty);

  const dateRange = { from: dateFrom, to: dateTo };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!session || session.role !== "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4">
        <Card className="w-full max-w-sm text-center shadow-lg border-0 rounded-3xl">
          <CardContent className="py-10">
            <div className="mx-auto h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-inner mb-6">
              <User className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="mb-6 text-muted-foreground text-sm">Sesi pelanggan Anda tidak ditemukan atau sudah kadaluarsa.</p>
            <Button asChild className="w-full rounded-xl h-12 text-base"><Link to="/login">Masuk Kembali</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const OrderHistoryTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#f0f0f0" }}>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Tanggal</th>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Item</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Status</th>
        <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, borderBottom: "2px solid #ddd" }}>Total</th>
      </tr></thead>
      <tbody>
        {filteredOrders.map(o => (
          <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px", fontSize: 11 }}>{new Date(o.createdAt).toLocaleString("id-ID")}</td>
            <td style={{ padding: "6px 10px", fontSize: 11 }}>{o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>
              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, background: "#e8f5e9", color: "#2e7d32" }}>{statusLabels[o.status]}</span>
            </td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>Rp {getOrderTotal(o).toLocaleString("id-ID")}</td>
          </tr>
        ))}
        <tr style={{ background: "#e8f5e9", fontWeight: 700 }}>
          <td colSpan={3} style={{ padding: "10px", borderTop: "2px solid #4CAF50" }}>Total</td>
          <td style={{ padding: "10px", textAlign: "right", borderTop: "2px solid #4CAF50", fontFamily: "monospace" }}>Rp {totalSpending.toLocaleString("id-ID")}</td>
        </tr>
      </tbody>
    </table>
  );

  const SpendingTable = () => (
    <>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-block", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", margin: 4, textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "#888" }}>Total Belanja</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2C3E50" }}>Rp {totalSpending.toLocaleString("id-ID")}</div>
        </div>
        <div style={{ display: "inline-block", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", margin: 4, textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "#888" }}>Total Pesanan</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2C3E50" }}>{totalOrders}</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#f0f0f0" }}>
          <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Bulan</th>
          <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Pesanan</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, borderBottom: "2px solid #ddd" }}>Total</th>
        </tr></thead>
        <tbody>
          {monthlyData.map(m => (
            <tr key={m.month} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "6px 10px", fontSize: 11 }}>{m.month}</td>
              <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{m.count}</td>
              <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>Rp {m.total.toLocaleString("id-ID")}</td>
            </tr>
          ))}
          <tr style={{ background: "#e8f5e9", fontWeight: 700 }}>
            <td colSpan={2} style={{ padding: "10px", borderTop: "2px solid #4CAF50" }}>Total</td>
            <td style={{ padding: "10px", textAlign: "right", borderTop: "2px solid #4CAF50", fontFamily: "monospace" }}>Rp {totalSpending.toLocaleString("id-ID")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const FavoritesTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#f0f0f0" }}>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>#</th>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Produk</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Dipesan</th>
        <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, borderBottom: "2px solid #ddd" }}>Total Belanja</th>
      </tr></thead>
      <tbody>
        {favoriteProducts.map((p, i) => (
          <tr key={p.name} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px", fontSize: 11 }}>{i + 1}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, fontWeight: 500 }}>{p.name}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{p.qty}x</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>Rp {p.spent.toLocaleString("id-ID")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Link to="/">
              <WarungSyncLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6 animate-slide-in">
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

        <div className="grid grid-cols-2 gap-4">
          <Button className="h-20 flex-col gap-2" asChild>
            <Link to="/customer/stores"><ShoppingBag className="h-6 w-6" />Belanja</Link>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            {/* Rute disesuaikan menuju orders untuk ID 'all' atau generik */}
            <Link to="/customer/store/all/orders"><Package className="h-6 w-6" />Pesanan Saya</Link>
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Pesanan Terakhir</CardTitle></CardHeader>
          <CardContent>
            {loadingOrders ? (
              <p className="text-sm text-muted-foreground">Memuat pesanan...</p>
            ) : allOrders.length === 0 ? (
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
                      <p className="mt-1 text-sm font-bold text-primary">Rp {getOrderTotal(o).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5" />Laporan Saya</h2>

          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div><Label>Dari</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label>Sampai</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>

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

            <TabsContent value="history">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">📋 Riwayat Pesanan</CardTitle>
                  <PrintReportButton title="Riwayat Pesanan" subtitle={`Pelanggan: ${session.name}`} dateRange={dateRange}><OrderHistoryTable /></PrintReportButton>
                </CardHeader>
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
                            <td className="px-3 py-2 text-right font-mono">Rp {getOrderTotal(o).toLocaleString("id-ID")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spending">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">💰 Laporan Pengeluaran</CardTitle>
                  <PrintReportButton title="Laporan Pengeluaran" subtitle={`Pelanggan: ${session.name}`} dateRange={dateRange}><SpendingTable /></PrintReportButton>
                </CardHeader>
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

            <TabsContent value="favorites">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">❤️ Produk Favorit</CardTitle>
                  <PrintReportButton title="Produk Favorit" subtitle={`Pelanggan: ${session.name}`} dateRange={dateRange}><FavoritesTable /></PrintReportButton>
                </CardHeader>
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