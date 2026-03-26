import { useState, useMemo } from "react";
import { getOrders, getProducts, getStockLogs } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import PrintReportButton from "@/components/PrintReportButton";

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

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filtered.forEach(o => o.items.forEach(i => {
    if (!productSales[i.product.id]) productSales[i.product.id] = { name: i.product.name, qty: 0, revenue: 0 };
    productSales[i.product.id].qty += i.quantity;
    productSales[i.product.id].revenue += i.product.price * i.quantity;
  }));
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

  const lowStock = products.filter(p => p.stock <= 10);

  const dailySales: Record<string, { date: string; total: number; count: number }> = {};
  filtered.forEach(o => {
    const dateKey = new Date(o.createdAt).toLocaleDateString("id-ID");
    if (!dailySales[dateKey]) dailySales[dateKey] = { date: dateKey, total: 0, count: 0 };
    dailySales[dateKey].total += o.total;
    dailySales[dateKey].count += 1;
  });
  const dailyData = Object.values(dailySales).reverse();

  const filteredLogs = stockLogs.filter(l => {
    const d = new Date(l.createdAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const dateRange = { from: dateFrom, to: dateTo };

  // Reusable print table content components
  const SalesTable = () => (
    <>
      <div className="summary-row" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-block", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", margin: 4, textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "#888" }}>Total Penjualan</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2C3E50" }}>Rp {totalSales.toLocaleString("id-ID")}</div>
        </div>
        <div style={{ display: "inline-block", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", margin: 4, textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "#888" }}>Total Transaksi</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2C3E50" }}>{totalTransactions}</div>
        </div>
        <div style={{ display: "inline-block", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", margin: 4, textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "#888" }}>Rata-rata</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2C3E50" }}>Rp {Math.round(avgTransaction).toLocaleString("id-ID")}</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#f0f0f0" }}>
          <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Tanggal</th>
          <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Pesanan</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, borderBottom: "2px solid #ddd" }}>Total</th>
        </tr></thead>
        <tbody>
          {dailyData.map(d => (
            <tr key={d.date} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "6px 10px", fontSize: 11 }}>{d.date}</td>
              <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{d.count}</td>
              <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>Rp {d.total.toLocaleString("id-ID")}</td>
            </tr>
          ))}
          <tr style={{ background: "#e8f5e9", fontWeight: 700 }}>
            <td colSpan={2} style={{ padding: "10px", borderTop: "2px solid #4CAF50" }}>Grand Total</td>
            <td style={{ padding: "10px", textAlign: "right", borderTop: "2px solid #4CAF50", fontFamily: "monospace" }}>Rp {totalSales.toLocaleString("id-ID")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const TransactionsTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#f0f0f0" }}>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Waktu</th>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Pelanggan</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Tipe</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Status</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Bayar</th>
        <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, borderBottom: "2px solid #ddd" }}>Total</th>
      </tr></thead>
      <tbody>
        {filtered.map(o => (
          <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px", fontSize: 11 }}>{new Date(o.createdAt).toLocaleString("id-ID")}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, fontWeight: 500 }}>{o.customerName || "—"}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{o.type === "pos" ? "POS" : "Online"}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{o.status}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{o.paymentMethod === "cash" ? "Cash" : "Transfer"}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>Rp {o.total.toLocaleString("id-ID")}</td>
          </tr>
        ))}
        <tr style={{ background: "#e8f5e9", fontWeight: 700 }}>
          <td colSpan={5} style={{ padding: "10px", borderTop: "2px solid #4CAF50" }}>Total</td>
          <td style={{ padding: "10px", textAlign: "right", borderTop: "2px solid #4CAF50", fontFamily: "monospace" }}>Rp {totalSales.toLocaleString("id-ID")}</td>
        </tr>
      </tbody>
    </table>
  );

  const ProductsTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#f0f0f0" }}>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>#</th>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Produk</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Terjual</th>
        <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, borderBottom: "2px solid #ddd" }}>Pendapatan</th>
      </tr></thead>
      <tbody>
        {topProducts.map((p, i) => (
          <tr key={p.name} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px", fontSize: 11 }}>{i + 1}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, fontWeight: 500 }}>{p.name}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>{p.qty}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>Rp {p.revenue.toLocaleString("id-ID")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const StockTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#f0f0f0" }}>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Waktu</th>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Produk</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Perubahan</th>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Alasan</th>
      </tr></thead>
      <tbody>
        {filteredLogs.slice(0, 50).map(l => (
          <tr key={l.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px", fontSize: 11 }}>{new Date(l.createdAt).toLocaleString("id-ID")}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, fontWeight: 500 }}>{l.productName}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center", fontWeight: 700, color: l.change > 0 ? "#4CAF50" : "#e53935" }}>
              {l.change > 0 ? `+${l.change}` : l.change}
            </td>
            <td style={{ padding: "6px 10px", fontSize: 11, color: "#666" }}>{l.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const LowStockTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#f0f0f0" }}>
        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, borderBottom: "2px solid #ddd" }}>Produk</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Stok</th>
        <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, borderBottom: "2px solid #ddd" }}>Status</th>
      </tr></thead>
      <tbody>
        {lowStock.map(p => (
          <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px", fontSize: 11, fontWeight: 500 }}>{p.name}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center", fontWeight: 700, color: "#e53935" }}>{p.stock}</td>
            <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center" }}>
              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, background: p.stock === 0 ? "#fce4ec" : "#fff3e0", color: p.stock === 0 ? "#c62828" : "#e65100" }}>
                {p.stock === 0 ? "Habis" : "Menipis"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-wrap items-end gap-4">
        <div><Label>Dari</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div><Label>Sampai</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
      </div>

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

        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">📊 Laporan Penjualan</CardTitle>
              <PrintReportButton title="Laporan Penjualan" dateRange={dateRange}><SalesTable /></PrintReportButton>
            </CardHeader>
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

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">📋 Laporan Transaksi</CardTitle>
              <PrintReportButton title="Laporan Transaksi" dateRange={dateRange}><TransactionsTable /></PrintReportButton>
            </CardHeader>
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
                        <td className="px-3 py-2 text-center"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.type === "pos" ? "POS" : "Online"}</span></td>
                        <td className="px-3 py-2 text-center"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{o.status}</span></td>
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

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">🏆 Produk Terlaris</CardTitle>
              <PrintReportButton title="Laporan Produk Terlaris" dateRange={dateRange}><ProductsTable /></PrintReportButton>
            </CardHeader>
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

        <TabsContent value="stock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">📦 Riwayat Perubahan Stok</CardTitle>
              <PrintReportButton title="Laporan Riwayat Stok" dateRange={dateRange}><StockTable /></PrintReportButton>
            </CardHeader>
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

        <TabsContent value="lowstock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">⚠️ Stok Rendah ({lowStock.length} produk)</CardTitle>
              <PrintReportButton title="Laporan Stok Rendah" subtitle={`${lowStock.length} produk dengan stok ≤ 10`}><LowStockTable /></PrintReportButton>
            </CardHeader>
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
