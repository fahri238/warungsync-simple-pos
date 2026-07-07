import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { getSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, LogOut, User, BarChart3, Heart, DollarSign, ArrowLeft, Printer, Calendar, ChevronRight } from "lucide-react";
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
  delivering: "bg-secondary/10 text-secondary",
  completed: "bg-success/10 text-success",
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
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-3xl">
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-background rounded-full flex items-center justify-center shadow-inner mb-6">
              <User className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
            <p className="mb-8 text-muted-foreground text-sm">Sesi pelanggan Anda tidak ditemukan atau sudah kadaluarsa.</p>
            <Button asChild className="w-full rounded-xl h-12 text-base shadow-md"><Link to="/login">Masuk Kembali</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* HEADER UTAMA */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4 max-w-6xl">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Link to="/" className="hidden sm:block">
              <WarungSyncLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-4 bg-muted/50 py-1.5 px-3 md:px-4 rounded-full border border-border/50">
            <div className="flex flex-col items-end mr-1">
              <span className="text-xs md:text-sm font-bold text-foreground leading-none">{session.name}</span>
              <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase mt-1 tracking-wider">Pelanggan</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
               <User className="h-4 w-4 text-primary" />
            </div>
            <div className="h-6 w-px bg-border mx-1"></div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* BAGIAN ATAS: Profil & Pesanan Terakhir */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* KOLOM KIRI (Profil & Navigasi Cepat) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-sm border-border/60 overflow-hidden rounded-[1.5rem]">
              <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 border-b border-border/50 flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Informasi Akun</CardTitle>
              </div>
              <CardContent className="p-6 space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground font-medium">Nama Lengkap</span>
                  <span className="font-bold text-foreground">{session.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground font-medium">Alamat Email</span>
                  <span className="font-bold text-foreground">{session.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground font-medium">Nomor Handphone</span>
                  <span className="font-bold text-foreground">{session.phone || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button className="h-24 md:h-28 flex-col gap-3 rounded-2xl shadow-sm hover:shadow-md transition-all group" asChild>
                <Link to="/customer/stores">
                  <div className="p-2 md:p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <span className="font-bold text-sm md:text-base tracking-wide">Mulai Belanja</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 md:h-28 flex-col gap-3 rounded-2xl border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all group" asChild>
                <Link to="/customer/store/all/orders">
                  <div className="p-2 md:p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <span className="font-bold text-sm md:text-base tracking-wide text-foreground">Semua Pesanan</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* KOLOM KANAN (Pesanan Terakhir) */}
          <div className="lg:col-span-7 h-full">
            <Card className="shadow-sm border-border/60 h-full flex flex-col rounded-[1.5rem]">
              <CardHeader className="border-b border-border/50 py-5">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-lg font-bold flex items-center gap-2">
                     <Package className="h-5 w-5 text-muted-foreground" /> Pesanan Terakhir
                   </CardTitle>
                   <Link to="/customer/store/all/orders" className="text-xs font-bold text-primary hover:underline flex items-center">
                     Lihat Semua <ChevronRight className="h-3 w-3 ml-0.5" />
                   </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {loadingOrders ? (
                  <div className="p-8 text-center text-muted-foreground animate-pulse text-sm">Memuat riwayat pesanan Anda...</div>
                ) : allOrders.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-bold text-foreground">Belum ada pesanan</p>
                    <p className="text-sm text-muted-foreground mt-1">Mulai belanja untuk melihat riwayat Anda di sini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {allOrders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-foreground text-sm leading-tight line-clamp-1">{o.items.map(i => i.product.name).join(", ")}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(o.createdAt).toLocaleDateString("id-ID")}
                            </span>
                            <span className="h-1 w-1 bg-border rounded-full hidden sm:block"></span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[o.status] || 'bg-gray-100'}`}>
                              {statusLabels[o.status] || o.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Total</p>
                          <p className="font-black text-primary text-base">Rp {getOrderTotal(o).toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BAGIAN BAWAH: Laporan & Statistik */}
        <div className="space-y-6 pt-6 border-t border-border/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2 tracking-tight">
                <BarChart3 className="h-6 w-6 md:h-7 md:w-7 text-primary" /> Ringkasan Laporan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Analisis riwayat belanja Anda berdasarkan periode tertentu.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-card p-2 md:p-3 rounded-xl border border-border/60 shadow-sm">
              <div className="flex items-center gap-2 px-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Periode</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-xs" />
                <span className="text-muted-foreground text-xs font-medium">s/d</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <Card className="rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow border-none bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Belanja</CardTitle>
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"><DollarSign className="h-4 w-4 text-primary" /></div>
              </CardHeader>
              <CardContent><p className="text-2xl md:text-3xl font-black text-foreground">Rp {totalSpending.toLocaleString("id-ID")}</p></CardContent>
            </Card>
            <Card className="rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow border-none bg-gradient-to-br from-info/5 to-transparent">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pesanan Dibuat</CardTitle>
                <div className="h-8 w-8 bg-info/10 rounded-full flex items-center justify-center"><Package className="h-4 w-4 text-info" /></div>
              </CardHeader>
              <CardContent><p className="text-2xl md:text-3xl font-black text-foreground">{totalOrders} <span className="text-base font-semibold text-muted-foreground">Transaksi</span></p></CardContent>
            </Card>
            <Card className="rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow border-none bg-gradient-to-br from-success/5 to-transparent">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pesanan Selesai</CardTitle>
                <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center"><Heart className="h-4 w-4 text-success" /></div>
              </CardHeader>
              <CardContent><p className="text-2xl md:text-3xl font-black text-foreground">{completedOrders} <span className="text-base font-semibold text-muted-foreground">Berhasil</span></p></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="history" className="space-y-6 pt-2">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto md:mx-0 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="history" className="rounded-lg text-sm font-semibold">Riwayat Pesanan</TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-lg text-sm font-semibold">Produk Favorit</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="focus-visible:outline-none">
              <Card className="rounded-[1.5rem] border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 pb-4 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2"><Package className="h-5 w-5 text-primary"/> Rincian Riwayat Pesanan</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handlePrint("Riwayat Pesanan", "history")} className="h-9 gap-2 shadow-sm rounded-xl">
                    <Printer className="h-4 w-4 text-muted-foreground"/> Cetak PDF
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredOrders.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">Tidak ada pesanan pada periode ini.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/80 bg-muted/30">
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Tanggal</th>
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Item</th>
                          <th className="px-5 py-4 text-center font-semibold text-muted-foreground uppercase tracking-wider text-xs">Status</th>
                          <th className="px-5 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border/40">{filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4 text-foreground text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                            <td className="px-5 py-4 text-foreground text-sm font-medium">{o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}</td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColors[o.status] || 'bg-gray-100'}`}>{statusLabels[o.status] || o.status}</span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold whitespace-nowrap text-primary">Rp {getOrderTotal(o).toLocaleString("id-ID")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="focus-visible:outline-none">
              <Card className="rounded-[1.5rem] border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 pb-4 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2"><Heart className="h-5 w-5 text-destructive"/> Daftar Produk Favorit</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handlePrint("Daftar Produk Favorit", "favorites")} className="h-9 gap-2 shadow-sm rounded-xl">
                    <Printer className="h-4 w-4 text-muted-foreground"/> Cetak PDF
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {favoriteProducts.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">Belum ada data produk favorit.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/80 bg-muted/30">
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs w-12">#</th>
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Nama Produk</th>
                          <th className="px-5 py-4 text-center font-semibold text-muted-foreground uppercase tracking-wider text-xs">Kuantitas Dipesan</th>
                          <th className="px-5 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Total Nilai Belanja</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border/40">{favoriteProducts.map((p, i) => (
                          <tr key={p.name} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4 text-muted-foreground font-medium">{i + 1}</td>
                            <td className="px-5 py-4 font-bold text-foreground">{p.name}</td>
                            <td className="px-5 py-4 text-center">
                               <span className="bg-secondary/10 border border-secondary/20 text-secondary font-black px-3 py-1 rounded-full text-xs">{p.qty}x</span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-primary">Rp {p.spent.toLocaleString("id-ID")}</td>
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
      </main>
    </div>
  );
};

export default CustomerDashboard;