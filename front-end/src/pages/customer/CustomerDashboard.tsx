import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { getSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, LogOut, User, BarChart3, Heart, DollarSign, ArrowLeft, Printer } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { fetchOrders } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Diantar", completed: "Selesai"
};
const statusColors: Record<string, string> = {
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

  const sessionId = session?.id;
  const sessionRole = session?.role as string;

  useEffect(() => {
    if (!sessionId || !["customer", "pelanggan"].includes(sessionRole)) {
      setAllOrders([]);
      setLoadingOrders(false);
      return;
    }

    fetchOrders()
      .then((orders) => {
        const myOnlineOrders = orders.filter((o: Order) => (o as any).userId === sessionId && o.type === "online");
        setAllOrders(myOnlineOrders);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat data pesanan");
      })
      .finally(() => setLoadingOrders(false));
      
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
  const completedOrders = filteredOrders.filter(o => ["completed", "selesai"].includes(o.status)).length;

  const productFreq: Record<string, { name: string; qty: number; spent: number }> = {};
  filteredOrders.forEach(o => o.items.forEach(i => {
    if (!productFreq[i.product.id]) productFreq[i.product.id] = { name: i.product.name, qty: 0, spent: 0 };
    productFreq[i.product.id].qty += i.quantity;
    productFreq[i.product.id].spent += (i.product?.price || 0) * i.quantity;
  }));
  const favoriteProducts = Object.values(productFreq).sort((a, b) => b.qty - a.qty);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // FUNGSI PENCETAKAN MANUAL
  const handlePrint = (title: string, type: 'history' | 'favorites') => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return toast.error("Pop-up diblokir browser");

    const dateStr = new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });
    const filterStr = (dateFrom || dateTo) ? `<div class="subtitle">Periode: ${dateFrom || 'Awal'} s/d ${dateTo || 'Sekarang'}</div>` : '';

    let tableContent = "";

    if (type === 'history') {
      tableContent = `
        <table>
          <thead><tr><th>Tanggal</th><th>Item</th><th>Status</th><th class="right">Total</th></tr></thead>
          <tbody>
            ${filteredOrders.map(o => `
              <tr>
                <td>${new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                <td>${o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}</td>
                <td>${statusLabels[o.status] || o.status}</td>
                <td class="right">Rp ${getOrderTotal(o).toLocaleString("id-ID")}</td>
              </tr>
            `).join('')}
            <tr class="bold highlight"><td colspan="3">TOTAL KESELURUHAN</td><td class="right">Rp ${totalSpending.toLocaleString("id-ID")}</td></tr>
          </tbody>
        </table>`;
    } else if (type === 'favorites') {
      tableContent = `
        <table>
          <thead><tr><th>#</th><th>Nama Produk</th><th class="center">Total Dipesan</th><th class="right">Total Nilai Belanja</th></tr></thead>
          <tbody>
            ${favoriteProducts.map((p, i) => `
              <tr>
                <td>${i + 1}</td><td>${p.name}</td><td class="center">${p.qty}x</td><td class="right">Rp ${p.spent.toLocaleString("id-ID")}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>Laporan - ${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #222; padding-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; color: #111; text-transform: uppercase; }
          .subtitle { font-size: 14px; color: #555; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th { background-color: #f4f4f5; text-align: left; padding: 12px; border: 1px solid #ddd; font-weight: 600; }
          td { padding: 10px 12px; border: 1px solid #ddd; }
          .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
          .highlight { background-color: #f8fafc; }
          .footer { margin-top: 40px; font-size: 12px; color: #777; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="subtitle">Pelanggan: <b>${session?.name || 'Umum'}</b></div>
          ${filterStr}
        </div>
        ${tableContent}
        <div class="footer">Dicetak otomatis dari WarungSync pada ${dateStr}</div>
        <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!session || !["customer", "pelanggan"].includes(session.role as string)) {
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status] || 'bg-gray-100'}`}>
                        {statusLabels[o.status] || o.status}
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Riwayat Pesanan</TabsTrigger>
              <TabsTrigger value="favorites">Favorit</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">📋 Riwayat Pesanan</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handlePrint("Riwayat Pesanan", "history")} className="h-8 gap-1.5"><Printer className="h-3.5 w-3.5"/> Cetak Laporan</Button>
                </CardHeader>
                <CardContent>
                  {filteredOrders.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pesanan.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/80 bg-muted/50">
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground rounded-tl-lg">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Item</th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground rounded-tr-lg">Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border/50">{filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-foreground text-xs">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                            <td className="px-4 py-3 text-foreground text-xs">{o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[o.status] || 'bg-gray-100'}`}>{statusLabels[o.status] || o.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium">Rp {getOrderTotal(o).toLocaleString("id-ID")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">❤️ Produk Favorit</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handlePrint("Daftar Produk Favorit", "favorites")} className="h-8 gap-1.5"><Printer className="h-3.5 w-3.5"/> Cetak Laporan</Button>
                </CardHeader>
                <CardContent>
                  {favoriteProducts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/80 bg-muted/50">
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12 rounded-tl-lg">#</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Produk</th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Kuantitas Dipesan</th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground rounded-tr-lg">Total Nilai Belanja</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border/50">{favoriteProducts.map((p, i) => (
                          <tr key={p.name} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                            <td className="px-4 py-3 text-center"><span className="bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full text-xs">{p.qty}x</span></td>
                            <td className="px-4 py-3 text-right font-mono font-medium">Rp {p.spent.toLocaleString("id-ID")}</td>
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