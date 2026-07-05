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
        // MOCK DATA (Demo):
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
            {
              id: "log-3",
              productId: productData[0].id,
              productName: productData[0].name,
              change: -2,
              reason: "Penjualan Online",
              createdAt: new Date().toISOString(),
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
      if (o.status !== "completed") return false; 
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const totalSales = filtered.reduce((s, o) => s + getOrderTotal(o), 0);
  const totalTransactions = filtered.length;
  const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const productSales: Record<
    string,
    { name: string; qty: number; revenue: number }
  > = {};
  filtered.forEach((o) =>
    o.items.forEach((i) => {
      if (!productSales[i.product.id])
        productSales[i.product.id] = {
          name: i.product.name,
          qty: 0,
          revenue: 0,
        };
      productSales[i.product.id].qty += i.quantity;
      productSales[i.product.id].revenue +=
        (i.product?.price || 0) * i.quantity;
    }),
  );
  const topProducts = Object.values(productSales).sort(
    (a, b) => b.revenue - a.revenue,
  );

  const lowStock = products.filter((p) => p.stock <= 10);

  const dailySales: Record<
    string,
    { date: string; total: number; count: number }
  > = {};
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

  // --- PRINT FUNCTION REPORTS ---
  const handlePrintReport = (type: string, title: string) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const d = new Date();
    const printDate = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const periode =
      dateFrom || dateTo
        ? `${dateFrom ? new Date(dateFrom).toLocaleDateString("id-ID") : "Awal"} s/d ${dateTo ? new Date(dateTo).toLocaleDateString("id-ID") : "Sekarang"}`
        : "Semua Waktu";

    let tableHtml = "";
    let summaryHtml = "";

    if (type === "sales") {
      summaryHtml = `
        <div class="summary-box">
          <div class="summary-item"><div class="summary-label">Total Penjualan</div><div class="summary-value">Rp ${totalSales.toLocaleString("id-ID")}</div></div>
          <div class="summary-item"><div class="summary-label">Total Transaksi Selesai</div><div class="summary-value">${totalTransactions}</div></div>
          <div class="summary-item"><div class="summary-label">Rata-rata Transaksi</div><div class="summary-value">Rp ${Math.round(avgTransaction).toLocaleString("id-ID")}</div></div>
        </div>`;
      tableHtml = `
        <table>
          <thead><tr><th>Tanggal</th><th class="text-center">Jumlah Pesanan</th><th class="text-right">Total Penjualan</th></tr></thead>
          <tbody>
            ${dailyData.map((d) => `<tr><td>${d.date}</td><td class="text-center">${d.count}</td><td class="text-right font-mono">Rp ${d.total.toLocaleString("id-ID")}</td></tr>`).join("")}
            <tr style="background-color: #f8f9fa;"><td colspan="2" class="font-bold text-right">Grand Total</td><td class="text-right font-mono font-bold">Rp ${totalSales.toLocaleString("id-ID")}</td></tr>
          </tbody>
        </table>`;
    } else if (type === "transactions") {
      tableHtml = `
        <table>
          <thead><tr><th>Waktu</th><th>Pelanggan</th><th class="text-center">Tipe</th><th class="text-center">Status</th><th class="text-center">Metode Bayar</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            ${filtered.map((o) => `<tr><td>${new Date(o.createdAt).toLocaleString("id-ID")}</td><td>${o.customerName || "—"}</td><td class="text-center">${o.type === "pos" ? "POS" : "Online"}</td><td class="text-center">${o.status}</td><td class="text-center">${o.paymentMethod === "cash" ? "Cash" : "Transfer"}</td><td class="text-right font-mono">Rp ${getOrderTotal(o).toLocaleString("id-ID")}</td></tr>`).join("")}
            <tr style="background-color: #f8f9fa;"><td colspan="5" class="font-bold text-right">Total Transaksi</td><td class="text-right font-mono font-bold">Rp ${totalSales.toLocaleString("id-ID")}</td></tr>
          </tbody>
        </table>`;
    } else if (type === "products") {
      tableHtml = `
        <table>
          <thead><tr><th>Peringkat</th><th>Nama Produk</th><th class="text-center">Terjual</th><th class="text-right">Total Pendapatan</th></tr></thead>
          <tbody>
            ${topProducts.map((p, i) => `<tr><td class="text-center">${i + 1}</td><td>${p.name}</td><td class="text-center">${p.qty}</td><td class="text-right font-mono">Rp ${p.revenue.toLocaleString("id-ID")}</td></tr>`).join("")}
          </tbody>
        </table>`;
    } else if (type === "stock") {
      tableHtml = `
        <table>
          <thead><tr><th>Waktu Perubahan</th><th>Nama Produk</th><th class="text-center">Perubahan</th><th>Alasan</th></tr></thead>
          <tbody>
            ${filteredLogs
              .slice(0, 100)
              .map(
                (l) =>
                  `<tr><td>${new Date(l.createdAt).toLocaleString("id-ID")}</td><td>${l.productName}</td><td class="text-center font-bold" style="color: ${l.change > 0 ? "#16a34a" : "#dc2626"}">${l.change > 0 ? "+" + l.change : l.change}</td><td>${l.reason}</td></tr>`,
              )
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
          .title { font-size: 22px; font-weight: 800; margin: 0 0 5px 0; color: #2c3e50; letter-spacing: 1px; }
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
          .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Toko ${session?.name?.split(' ')[0] || 'Kita'}</h1>
          <p class="subtitle">${title}</p>
        </div>
        <div class="meta">
          <div><strong>Periode Laporan:</strong> ${periode}</div>
          <div><strong>Dicetak pada:</strong> ${printDate}</div>
        </div>
        ${summaryHtml}
        ${tableHtml}
        <div class="footer">
          Dokumen ini dihasilkan secara otomatis oleh sistem pencatatan WarungSync.<br>
          Halaman ini sah sebagai dokumen internal untuk keperluan evaluasi dan rekapitulasi.
        </div>
        <script>
          window.onload = () => { setTimeout(() => window.print(), 500); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PENGECEKAN KEAMANAN UNTUK OWNER
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
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak memiliki izin untuk mengakses halaman ini.
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
        <p className="text-muted-foreground animate-pulse">
          Menghitung dan memuat data laporan...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* DATA FILTER  */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>Dari</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <Label>Sampai</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* CARD STATISTIK */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Total Penjualan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              Rp {totalSales.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Transaksi Selesai
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {totalTransactions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Rata-rata Transaksi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              Rp {Math.round(avgTransaction).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Stok Rendah
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {lowStock.length} produk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DATA TABLE ON THE SCREEN */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
          <TabsTrigger value="lowstock">Stok Rendah</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-base">📊 Laporan Penjualan</CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  handlePrintReport("sales", "Laporan Penjualan Harian")
                }
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {dailyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Belum ada data penjualan selesai.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Tanggal
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold">
                          Jumlah Pesanan
                        </th>
                        <th className="px-3 py-3 text-right text-muted-foreground font-semibold">
                          Total Penjualan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map((d) => (
                        <tr
                          key={d.date}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-3 font-medium text-foreground">
                            {d.date}
                          </td>
                          <td className="px-3 py-3 text-center">{d.count}</td>
                          <td className="px-3 py-3 text-right font-mono font-medium">
                            Rp {d.total.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6 rounded-xl bg-primary/10 border border-primary/20 p-4 flex justify-between items-center">
                    <span className="font-bold text-foreground">
                      Grand Total Keseluruhan
                    </span>
                    <span className="font-black text-xl text-primary tracking-tight">
                      Rp {totalSales.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-base">
                📋 Laporan Transaksi Selesai
              </CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  handlePrintReport(
                    "transactions",
                    "Rekapitulasi Transaksi Selesai",
                  )
                }
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Belum ada transaksi selesai.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Waktu
                        </th>
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Pelanggan
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold">
                          Tipe
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold">
                          Metode Bayar
                        </th>
                        <th className="px-3 py-3 text-right text-muted-foreground font-semibold">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-3 text-foreground text-xs">
                            {new Date(o.createdAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">
                            {o.customerName || "—"}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="rounded-full bg-muted border border-border/60 px-2.5 py-1 text-xs font-medium">
                              {o.type === "pos" ? "POS Kasir" : "Online"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">
                            {o.paymentMethod === "cash"
                              ? "Tunai (COD)"
                              : "Transfer"}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-medium">
                            Rp {getOrderTotal(o).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-base">🏆 Produk Terlaris</CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  handlePrintReport("products", "Statistik Produk Terlaris")
                }
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Belum ada data penjualan produk.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold w-16">
                          #
                        </th>
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Nama Produk
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold">
                          Jumlah Terjual
                        </th>
                        <th className="px-3 py-3 text-right text-muted-foreground font-semibold">
                          Total Pendapatan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-3 text-muted-foreground font-bold">
                            {i + 1}
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">
                            {p.name}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                              {p.qty}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-medium text-primary">
                            Rp {p.revenue.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-base">
                📦 Riwayat Perubahan Stok
              </CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  handlePrintReport("stock", "Log Riwayat Perubahan Stok")
                }
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Belum ada riwayat perubahan stok.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Waktu Perubahan
                        </th>
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Produk
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold">
                          Perubahan
                        </th>
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Alasan / Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.slice(0, 50).map((l) => (
                        <tr
                          key={l.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-3 text-foreground text-xs">
                            {new Date(l.createdAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">
                            {l.productName}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${l.change > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                            >
                              {l.change > 0 ? `+${l.change}` : l.change}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {l.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowstock">
          <Card className="border-border/50 shadow-sm border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between bg-destructive/5 border-b border-destructive/10 pb-4">
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Stok Rendah (
                {lowStock.length} produk)
              </CardTitle>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  handlePrintReport("lowstock", "Daftar Barang Stok Rendah")
                }
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Semua stok barang dalam kondisi aman (lebih dari 10).
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-destructive/20">
                        <th className="px-3 py-3 text-left text-muted-foreground font-semibold">
                          Nama Produk
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold w-32">
                          Sisa Stok
                        </th>
                        <th className="px-3 py-3 text-center text-muted-foreground font-semibold w-40">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-destructive/10 last:border-0 hover:bg-destructive/5 transition-colors"
                        >
                          <td className="px-3 py-3 font-medium text-foreground">
                            {p.name}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-destructive text-lg">
                            {p.stock}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${p.stock === 0 ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-warning/20 text-warning-foreground border border-warning/30"}`}
                            >
                              {p.stock === 0 ? "HABIS TOTAL" : "SEGERA RESTOCK"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerReports;