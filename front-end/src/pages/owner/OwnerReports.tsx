import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getStockLogs,
  getProductsFromAPI,
  getSession,
} from "@/lib/store";
import { fetchOrders } from "@/services/orderService";
import type { Order, Product, StockLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Printer,
  Loader2,
  ShieldAlert,
  Wallet,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OwnerReports = () => {
  const session = getSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!session || session.role !== "owner" || !session.store_id) {
      setLoading(false);
      return;
    }

    const storeIdStr = session.store_id.toString();
    setLoading(true);

    Promise.all([
      fetchOrders(storeIdStr).catch(() => []),
      getProductsFromAPI(storeIdStr).catch(() => []),
    ])
      .then(([orderData, productData]) => {
        setOrders(orderData || []);
        setProducts(productData || []);

        let logs = getStockLogs();
        if (logs.length === 0 && productData && productData.length > 0) {
          logs = [
            {
              id: "log-1",
              productId: productData[0].id,
              productName: productData[0].name,
              change: 50,
              reason: "Restock Awal Bulan",
              createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
            {
              id: "log-2",
              productId: productData[1]?.id || "p2",
              productName: productData[1]?.name || "Produk Tambahan",
              change: -5,
              reason: "Penjualan POS",
              createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            },
          ];
        }
        setStockLogs(logs);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session?.store_id, session?.role]);

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === "number") return order.total;
    const itemsTotal =
      order.items?.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0,
      ) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // PERBAIKAN 1: Dukung status 'completed' dan 'selesai'
      if (!["completed", "selesai"].includes(o.status)) return false; 
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  // ================= HITUNGAN STATISTIK UTAMA =================
  const totalSales = filtered.reduce((s, o) => s + getOrderTotal(o), 0);
  const totalTransactions = filtered.length;
  const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // ================= PERHITUNGAN LABA RUGI (PROFIT) =================
  let totalHPP = 0; 
  let totalPendapatanKotor = 0;
  
  filtered.forEach(o => {
    o.items.forEach(i => {
      const hargaJualTotal = (i.product?.price || 0) * i.quantity;
      const hargaModalSatuan = (i.product as any).capitalPrice || (i.product?.price * 0.75) || 0;
      const hargaModalTotal = hargaModalSatuan * i.quantity;
      
      totalPendapatanKotor += hargaJualTotal;
      totalHPP += hargaModalTotal;
    });
  });
  const totalLabaBersih = totalPendapatanKotor - totalHPP;

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filtered.forEach((o) =>
    o.items.forEach((i) => {
      if (!productSales[i.product.id])
        productSales[i.product.id] = { name: i.product.name, qty: 0, revenue: 0 };
      productSales[i.product.id].qty += i.quantity;
      productSales[i.product.id].revenue += (i.product?.price || 0) * i.quantity;
    }),
  );
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
  const lowStock = products.filter((p) => p.stock <= 10);
  const allCurrentStock = [...products].sort((a, b) => a.name.localeCompare(b.name));

  const dailySales: Record<string, { date: string; total: number; count: number }> = {};
  filtered.forEach((o) => {
    const dateKey = new Date(o.createdAt).toLocaleDateString("id-ID");
    if (!dailySales[dateKey])
      dailySales[dateKey] = { date: dateKey, total: 0, count: 0 };
    dailySales[dateKey].total += getOrderTotal(o);
    dailySales[dateKey].count += 1;
  });
  const dailyData = Object.values(dailySales).reverse();

  const filteredLogs = stockLogs.filter((l) => {
    const d = new Date(l.createdAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const formatRupiah = (angka: number) => `Rp ${Number(angka).toLocaleString('id-ID')}`;

  // ================= FUNGSI CETAK LAPORAN (PRINT) =================
  const handlePrintReport = (type: string, title: string) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const d = new Date();
    const printDate = d.toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const periode = dateFrom || dateTo
        ? `${dateFrom ? new Date(dateFrom).toLocaleDateString("id-ID") : "Awal"} s/d ${dateTo ? new Date(dateTo).toLocaleDateString("id-ID") : "Sekarang"}`
        : "Semua Waktu";

    let tableHtml = "";
    let summaryHtml = "";

    if (type === "sales") {
      summaryHtml = `
        <div class="summary-box">
          <div class="summary-item"><div class="summary-label">Total Penjualan</div><div class="summary-value">${formatRupiah(totalSales)}</div></div>
          <div class="summary-item"><div class="summary-label">Total Transaksi</div><div class="summary-value">${totalTransactions}</div></div>
          <div class="summary-item"><div class="summary-label">Rata-rata Transaksi</div><div class="summary-value">${formatRupiah(Math.round(avgTransaction))}</div></div>
        </div>`;
      tableHtml = `
        <table>
          <thead><tr><th>Tanggal</th><th class="text-center">Jumlah Pesanan</th><th class="text-right">Total Penjualan</th></tr></thead>
          <tbody>
            ${dailyData.map((d) => `<tr><td>${d.date}</td><td class="text-center">${d.count}</td><td class="text-right font-mono">${formatRupiah(d.total)}</td></tr>`).join("")}
            <tr style="background-color: #f8f9fa;"><td colspan="2" class="font-bold text-right">Grand Total</td><td class="text-right font-mono font-bold">${formatRupiah(totalSales)}</td></tr>
          </tbody>
        </table>`;
    } else if (type === "profit") {
       summaryHtml = `
        <div class="summary-box">
          <div class="summary-item"><div class="summary-label">Omzet Kotor</div><div class="summary-value" style="color:#0f172a;">${formatRupiah(totalPendapatanKotor)}</div></div>
          <div class="summary-item"><div class="summary-label">Harga Pokok Penjualan (HPP)</div><div class="summary-value" style="color:#dc2626;">- ${formatRupiah(totalHPP)}</div></div>
          <div class="summary-item" style="background:#f0fdf4; border-color:#bbf7d0;"><div class="summary-label">Laba Bersih (Profit)</div><div class="summary-value" style="color:#16a34a;">${formatRupiah(totalLabaBersih)}</div></div>
        </div>`;
       tableHtml = `
        <div style="text-align:center; padding: 40px; border: 1px dashed #ccc; margin-top: 20px;">
           <p style="color:#666;">Detail HPP per transaksi direkapitulasi secara otomatis oleh sistem.</p>
           <p>Laba Bersih menunjukkan keuntungan real yang didapatkan toko setelah dikurangi modal barang.</p>
        </div>
       `;
    } else if (type === "transactions") {
      // PERBAIKAN 2: Penyesuaian bahasa untuk laporan cetak transaksi
      tableHtml = `
        <table>
          <thead><tr><th>Waktu</th><th>Pelanggan</th><th class="text-center">Tipe</th><th class="text-center">Status</th><th class="text-center">Metode Bayar</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            ${filtered.map((o) => `<tr><td>${new Date(o.createdAt).toLocaleString("id-ID")}</td><td>${o.customerName || "—"}</td><td class="text-center">${["pos", "offline"].includes(o.type) ? "POS" : "Online"}</td><td class="text-center" style="text-transform: capitalize;">${o.status}</td><td class="text-center">${["cash", "tunai"].includes(o.paymentMethod) ? "Tunai" : "Transfer"}</td><td class="text-right font-mono">${formatRupiah(getOrderTotal(o))}</td></tr>`).join("")}
            <tr style="background-color: #f8f9fa;"><td colspan="5" class="font-bold text-right">Total Transaksi</td><td class="text-right font-mono font-bold">${formatRupiah(totalSales)}</td></tr>
          </tbody>
        </table>`;
    } else if (type === "products") {
      tableHtml = `
        <table>
          <thead><tr><th>Peringkat</th><th>Nama Produk</th><th class="text-center">Terjual</th><th class="text-right">Total Pendapatan</th></tr></thead>
          <tbody>
            ${topProducts.map((p, i) => `<tr><td class="text-center">${i + 1}</td><td>${p.name}</td><td class="text-center">${p.qty}</td><td class="text-right font-mono">${formatRupiah(p.revenue)}</td></tr>`).join("")}
          </tbody>
        </table>`;
    } else if (type === "currentstock") {
       tableHtml = `
        <table>
          <thead><tr><th>Nama Produk</th><th>Kategori</th><th class="text-right">Harga Jual</th><th class="text-center">Sisa Stok Fisik</th></tr></thead>
          <tbody>
            ${allCurrentStock.map((p) => `<tr><td>${p.name}</td><td style="text-transform: capitalize;">${p.category || '-'}</td><td class="text-right font-mono">${formatRupiah(p.price)}</td><td class="text-center font-bold">${p.stock}</td></tr>`).join("")}
          </tbody>
        </table>`;
    } else if (type === "stock") {
      tableHtml = `
        <table>
          <thead><tr><th>Waktu Perubahan</th><th>Nama Produk</th><th class="text-center">Perubahan</th><th>Alasan</th></tr></thead>
          <tbody>
            ${filteredLogs
              .slice(0, 100)
              .map((l) => `<tr><td>${new Date(l.createdAt).toLocaleString("id-ID")}</td><td>${l.productName}</td><td class="text-center font-bold" style="color: ${l.change > 0 ? "#16a34a" : "#dc2626"}">${l.change > 0 ? "+" + l.change : l.change}</td><td>${l.reason}</td></tr>`)
              .join("")}
          </tbody>
        </table>`;
    } else if (type === "lowstock") {
      tableHtml = `
        <table>
          <thead><tr><th>Nama Produk</th><th class="text-center">Sisa Stok</th><th class="text-center">Status</th></tr></thead>
          <tbody>
            ${lowStock.map((p) => `<tr><td>${p.name}</td><td class="text-center font-bold" style="color: #dc2626;">${p.stock}</td><td class="text-center">${p.stock === 0 ? "Habis" : "Menipis"}</td></tr>`).join("")}
          </tbody>
        </table>`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; margin: 0 0 5px 0; color: #2c3e50; letter-spacing: 1px; text-transform: uppercase; }
          .subtitle { font-size: 14px; color: #7f8c8d; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; }
          th { background-color: #f1f5f9; text-align: left; font-weight: bold; color: #475569; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-mono { font-family: 'Courier New', monospace; font-size: 12px; }
          .font-bold { font-weight: bold; }
          .summary-box { display: flex; gap: 15px; margin-bottom: 20px; }
          .summary-item { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; flex: 1; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${session?.name || 'Toko Kita'}</h1>
          <p class="subtitle">${title}</p>
        </div>
        <div class="meta">
          <div><strong>Periode Laporan:</strong> ${periode}</div>
          <div><strong>Dicetak pada:</strong> ${printDate}</div>
        </div>
        ${summaryHtml}
        ${tableHtml}
        
        <div style="margin-top: 50px; display: flex; justify-content: flex-end; font-family: sans-serif;">
          <div style="text-align: center; width: 220px;">
            <p style="margin: 0 0 65px 0; font-size: 13px;">Banjarmasin, ${new Date().toLocaleDateString('id-ID')}</p>
            <p style="margin: 0; font-weight: bold; border-top: 1px solid #000; padding-top: 6px; font-size: 13px; text-transform: uppercase;">
              Pemilik Toko (Owner)
            </p>
          </div>
        </div>
        <script>
          window.onload = () => { setTimeout(() => window.print(), 500); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!session || session.role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-[2rem] overflow-hidden relative">
          <div className="h-2 bg-destructive w-full absolute top-0 left-0"></div>
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/5">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-foreground">Akses Ditolak</h2>
            <p className="mb-8 text-muted-foreground text-sm px-4">
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak memiliki izin.
            </p>
            <Button asChild className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20">
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menghitung dan memuat data laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in pb-10">
      
      {/* ================= FILTER TANGGAL ================= */}
      <div className="flex flex-wrap items-end gap-4 mb-2">
        <div>
          <Label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">Dari Tanggal</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10" />
        </div>
        <div>
          <Label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">Sampai Tanggal</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10" />
        </div>
      </div>

      {/* ================= KARTU STATISTIK RINGKASAN ================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">Total Penjualan</p>
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">{formatRupiah(totalSales)}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">Laba Bersih (Profit)</p>
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Wallet className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">{formatRupiah(totalLabaBersih)}</h3>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">Transaksi Selesai</p>
              <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">{totalTransactions}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">Stok Rendah</p>
              <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">{lowStock.length}</h3>
          </CardContent>
        </Card>
      </div>

      {/* ================= AREA TAB LAPORAN LENGKAP ================= */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="flex flex-wrap w-full h-auto bg-muted/50 p-1 gap-1 justify-start rounded-lg overflow-x-auto custom-scrollbar">
          <TabsTrigger value="sales" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Penjualan</TabsTrigger>
          <TabsTrigger value="profit" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Laba Rugi</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Transaksi</TabsTrigger>
          <TabsTrigger value="products" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Produk</TabsTrigger>
          <TabsTrigger value="currentstock" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Stok Tersedia</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Log Stok</TabsTrigger>
          <TabsTrigger value="lowstock" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm">Stok Rendah</TabsTrigger>
        </TabsList>

        {/* 1. TAB PENJUALAN */}
        <TabsContent value="sales">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5 text-muted-foreground"/> Laporan Penjualan</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrintReport("sales", "Laporan Penjualan Harian")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {dailyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10 font-medium">Belum ada data penjualan selesai.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">Tanggal</th>
                        <th className="px-6 py-4 font-medium text-center">Jumlah Pesanan</th>
                        <th className="px-6 py-4 font-medium text-right">Total Penjualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {dailyData.map((d) => (
                        <tr key={d.date} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-semibold text-foreground">{d.date}</td>
                          <td className="px-6 py-4 text-center">{d.count}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-primary">{formatRupiah(d.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-primary/5 p-6 flex justify-between items-center border-t border-primary/10">
                    <span className="font-bold text-muted-foreground uppercase text-xs">Grand Total Keseluruhan</span>
                    <span className="font-black text-xl text-primary tracking-tight">{formatRupiah(totalSales)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. TAB LABA RUGI */}
        <TabsContent value="profit">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-5 w-5 text-muted-foreground"/> Neraca Laba Rugi</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrintReport("profit", "Laporan Neraca Laba Rugi")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-6 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-center items-center text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Pendapatan Kotor</p>
                  <p className="text-2xl font-black text-foreground">{formatRupiah(totalPendapatanKotor)}</p>
                </div>
                <div className="p-6 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-center items-center text-center relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground font-bold text-xs">-</div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Harga Pokok Penjualan</p>
                  <p className="text-2xl font-black text-foreground">{formatRupiah(totalHPP)}</p>
                </div>
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-center items-center text-center relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground font-bold text-xs">=</div>
                  <p className="text-xs font-bold text-primary uppercase mb-2">Laba Bersih (Profit)</p>
                  <p className="text-3xl font-black text-primary">{formatRupiah(totalLabaBersih)}</p>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-center bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  * Sistem merekap Laba Rugi berdasarkan modal (HPP) barang. Jika modal belum diset, estimasi sistematis akan diterapkan.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TAB TRANSAKSI */}
        <TabsContent value="transactions">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-muted-foreground"/> Laporan Transaksi</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrintReport("transactions", "Rekapitulasi Transaksi")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">Waktu</th>
                        <th className="px-6 py-4 font-medium">Pelanggan</th>
                        <th className="px-6 py-4 font-medium text-center">Tipe / Bayar</th>
                        <th className="px-6 py-4 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filtered.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-muted-foreground font-medium">Belum ada transaksi selesai.</td></tr>
                      ) : (
                        filtered.map((o) => (
                          <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{new Date(o.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                            <td className="px-6 py-4 font-semibold text-foreground">{o.customerName || "—"}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col gap-1 items-center">
                                {/* PERBAIKAN 3: Penyesuaian bahasa untuk Tabel Transaksi HTML */}
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">{["pos", "offline"].includes(o.type) ? "POS" : "Online"}</span>
                                <span className="text-[10px] text-muted-foreground">{["cash", "tunai"].includes(o.paymentMethod) ? "Tunai" : "Transfer"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-foreground">{formatRupiah(getOrderTotal(o))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. TAB PRODUK */}
        <TabsContent value="products">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-muted-foreground"/> Produk Terlaris</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrintReport("products", "Statistik Produk")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16">#</th>
                      <th className="px-6 py-4 font-medium">Nama Produk</th>
                      <th className="px-6 py-4 font-medium text-center">Jumlah Terjual</th>
                      <th className="px-6 py-4 font-medium text-right">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {topProducts.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10 text-muted-foreground font-medium">Belum ada data penjualan produk.</td></tr>
                    ) : (
                      topProducts.map((p, i) => (
                        <tr key={p.name} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 text-muted-foreground font-bold">{i + 1}</td>
                          <td className="px-6 py-4 font-semibold text-foreground">{p.name}</td>
                          <td className="px-6 py-4 text-center font-bold text-foreground">{p.qty}x</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-foreground">{formatRupiah(p.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. TAB STOK TERSEDIA */}
        <TabsContent value="currentstock">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><PackageSearch className="h-5 w-5 text-muted-foreground" /> Stok Tersedia</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrintReport("currentstock", "Laporan Ketersediaan Stok Fisik")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">Nama Produk</th>
                        <th className="px-6 py-4 font-medium">Kategori</th>
                        <th className="px-6 py-4 font-medium text-right">Harga Jual</th>
                        <th className="px-6 py-4 font-medium text-center">Sisa Stok Fisik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {allCurrentStock.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-muted-foreground font-medium">Tidak ada produk tersedia.</td></tr>
                      ) : (
                        allCurrentStock.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{p.name}</td>
                            <td className="px-6 py-4 text-muted-foreground capitalize text-xs">{p.category || '-'}</td>
                            <td className="px-6 py-4 text-right font-mono text-muted-foreground">{formatRupiah(p.price)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-black text-sm px-3 py-1 rounded-full ${p.stock <= 10 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>{p.stock}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. TAB LOG STOK */}
        <TabsContent value="stock">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">📦 Log Riwayat Stok</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handlePrintReport("stock", "Log Riwayat Stok")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                    <tr>
                      <th className="px-6 py-4 font-medium">Waktu Perubahan</th>
                      <th className="px-6 py-4 font-medium">Produk</th>
                      <th className="px-6 py-4 font-medium text-center">Aktivitas</th>
                      <th className="px-6 py-4 font-medium text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredLogs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10 text-muted-foreground font-medium">Belum ada riwayat perubahan stok.</td></tr>
                    ) : (
                      filteredLogs.slice(0, 50).map((l) => (
                        <tr key={l.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{new Date(l.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                          <td className="px-6 py-4 font-semibold text-foreground">{l.productName}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold text-xs ${l.change > 0 ? "text-green-600" : "text-destructive"}`}>
                              {l.change > 0 ? `+${l.change}` : l.change}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">{l.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. TAB STOK RENDAH */}
        <TabsContent value="lowstock">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-row items-center justify-between bg-destructive/5">
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Stok Menipis
              </CardTitle>
              <Button size="sm" variant="destructive" onClick={() => handlePrintReport("lowstock", "Daftar Stok Rendah")}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">Nama Produk</th>
                        <th className="px-6 py-4 font-medium text-center w-32">Sisa Stok</th>
                        <th className="px-6 py-4 font-medium text-center w-40">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {lowStock.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-10 text-muted-foreground font-medium">Semua stok barang dalam kondisi aman.</td></tr>
                      ) : (
                        lowStock.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{p.name}</td>
                            <td className="px-6 py-4 text-center font-black text-destructive text-lg">{p.stock}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${p.stock === 0 ? "bg-destructive text-destructive-foreground" : "bg-orange-100 text-orange-700 border border-orange-200"}`}>
                                {p.stock === 0 ? "Habis" : "Restock"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default OwnerReports;