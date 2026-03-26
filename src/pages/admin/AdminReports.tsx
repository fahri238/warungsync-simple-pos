import { useState, useMemo } from "react";
import { getOrders, getProducts, getStockLogs } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react";

const AdminReports = () => {
  const orders = getOrders();
  const products = getProducts();
  const stockLogs = getStockLogs();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const totalSales = filtered.reduce((s, o) => s + o.total, 0);
  const totalTransactions = filtered.length;
  const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Product sales aggregation
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filtered.forEach(o => o.items.forEach(i => {
    if (!productSales[i.product.id]) productSales[i.product.id] = { name: i.product.name, qty: 0, revenue: 0 };
    productSales[i.product.id].qty += i.quantity;
    productSales[i.product.id].revenue += i.product.price * i.quantity;
  }));
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

  const lowStock = products.filter(p => p.stock <= 10);

  // Daily sales breakdown
  const dailySales: Record<string, { date: string; total: number; count: number }> = {};
  filtered.forEach(o => {
    const dateKey = new Date(o.createdAt).toLocaleDateString("id-ID");
    if (!dailySales[dateKey]) dailySales[dateKey] = { date: dateKey, total: 0, count: 0 };
    dailySales[dateKey].total += o.total;
    dailySales[dateKey].count += 1;
  });
  const dailyData = Object.values(dailySales).reverse();

  // Filtered stock logs
  const filteredLogs = stockLogs.filter(l => {
    const d = new Date(l.createdAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-wrap items-end gap-4">
        <div><Label>Dari</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div><Label>Sampai</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">Rp {totalSales.toLocaleString("id-ID")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{totalTransactions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Rata-rata Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">Rp {Math.round(avgTransaction).toLocaleString("id-ID")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{lowStock.length} produk</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
          <TabsTrigger value="lowstock">Stok Rendah</TabsTrigger>
        </TabsList>

        {/* 1. Laporan Penjualan */}
        <TabsContent value="sales">
          <Card>
            <CardHeader><CardTitle className="text-base">📊 Laporan Penjualan</CardTitle></CardHeader>
            <CardContent>
              {dailyData.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data penjualan.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="px-3 py-2 text-left text-muted-foreground">Tanggal</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Jumlah Pesanan</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Total Penjualan</th>
                    </tr></thead>
                    <tbody>{dailyData.map(d => (
                      <tr key={d.date} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{d.date}</td>
                        <td className="px-3 py-2 text-center">{d.count}</td>
                        <td className="px-3 py-2 text-right font-mono">Rp {d.total.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                  <div className="mt-4 rounded-lg bg-primary/10 p-3 flex justify-between">
                    <span className="font-semibold text-foreground">Grand Total</span>
                    <span className="font-bold text-primary">Rp {totalSales.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Laporan Transaksi */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader><CardTitle className="text-base">📋 Laporan Transaksi</CardTitle></CardHeader>
            <CardContent>
              {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada transaksi.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="px-3 py-2 text-left text-muted-foreground">Waktu</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Pelanggan</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Tipe</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Status</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Bayar</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Total</th>
                    </tr></thead>
                    <tbody>{filtered.map(o => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-foreground text-xs">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{o.customerName || "—"}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.type === "pos" ? "POS" : "Online"}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{o.status}</span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs">{o.paymentMethod === "cash" ? "Cash" : "Transfer"}</td>
                        <td className="px-3 py-2 text-right font-mono">Rp {o.total.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Laporan Produk Terlaris */}
        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle className="text-base">🏆 Produk Terlaris</CardTitle></CardHeader>
            <CardContent>
              {topProducts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="px-3 py-2 text-left text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Produk</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Terjual</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Pendapatan</th>
                    </tr></thead>
                    <tbody>{topProducts.map((p, i) => (
                      <tr key={p.name} className="border-b last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-center">{p.qty}</td>
                        <td className="px-3 py-2 text-right font-mono">Rp {p.revenue.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Laporan Stok (History) */}
        <TabsContent value="stock">
          <Card>
            <CardHeader><CardTitle className="text-base">📦 Riwayat Perubahan Stok</CardTitle></CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada riwayat stok.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="px-3 py-2 text-left text-muted-foreground">Waktu</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Produk</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Perubahan</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Alasan</th>
                    </tr></thead>
                    <tbody>{filteredLogs.slice(0, 50).map(l => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-foreground text-xs">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{l.productName}</td>
                        <td className={`px-3 py-2 text-center font-bold ${l.change > 0 ? "text-primary" : "text-destructive"}`}>
                          {l.change > 0 ? `+${l.change}` : l.change}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{l.reason}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Laporan Stok Rendah */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader><CardTitle className="text-base">⚠️ Stok Rendah ({lowStock.length} produk)</CardTitle></CardHeader>
            <CardContent>
              {lowStock.length === 0 ? <p className="text-sm text-muted-foreground">Semua stok aman.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="px-3 py-2 text-left text-muted-foreground">Produk</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Stok Saat Ini</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Status</th>
                    </tr></thead>
                    <tbody>{lowStock.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-center font-bold text-destructive">{p.stock}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                            {p.stock === 0 ? "Habis" : "Menipis"}
                          </span>
                        </td>
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
  );
};

export default AdminReports;
