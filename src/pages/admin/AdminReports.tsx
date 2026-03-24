import { useState, useMemo } from "react";
import { getOrders, getProducts } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminReports = () => {
  const orders = getOrders();
  const products = getProducts();
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

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filtered.forEach(o => o.items.forEach(i => {
    if (!productSales[i.product.id]) productSales[i.product.id] = { name: i.product.name, qty: 0, revenue: 0 };
    productSales[i.product.id].qty += i.quantity;
    productSales[i.product.id].revenue += i.product.price * i.quantity;
  }));
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

  const lowStock = products.filter(p => p.stock <= 10);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-wrap items-end gap-4">
        <div><Label>Dari</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div><Label>Sampai</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">Rp {totalSales.toLocaleString("id-ID")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Transaksi</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{totalTransactions}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Penjualan per Produk</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="px-3 py-2 text-left text-muted-foreground">Produk</th>
                  <th className="px-3 py-2 text-center text-muted-foreground">Terjual</th>
                  <th className="px-3 py-2 text-right text-muted-foreground">Pendapatan</th>
                </tr></thead>
                <tbody>{topProducts.map(p => (
                  <tr key={p.name} className="border-b last:border-0">
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

      <Card>
        <CardHeader><CardTitle className="text-base">Stok Rendah ({lowStock.length})</CardTitle></CardHeader>
        <CardContent>
          {lowStock.length === 0 ? <p className="text-sm text-muted-foreground">Semua stok aman.</p> : (
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <span className="font-medium text-foreground">{p.image} {p.name}</span>
                  <span className="text-sm font-bold text-destructive">Sisa: {p.stock}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
