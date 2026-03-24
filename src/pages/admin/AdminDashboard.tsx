import { useMemo } from "react";
import { getProducts, getOrders, getProductImage } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const products = getProducts();
  const orders = getOrders();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Most sold product
    const productSales: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(i => {
      productSales[i.product.name] = (productSales[i.product.name] || 0) + i.quantity;
    }));
    const topProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];

    const lowStock = products.filter(p => p.stock <= 10);

    return { todaySales, todayOrders: todayOrders.length, topProduct, lowStock, totalOrders: orders.length };
  }, [products, orders]);

  const cards = [
    {
      title: "Penjualan Hari Ini",
      value: `Rp ${stats.todaySales.toLocaleString("id-ID")}`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Pesanan Hari Ini",
      value: stats.todayOrders.toString(),
      icon: ShoppingCart,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Produk Terlaris",
      value: stats.topProduct ? `${stats.topProduct[0]} (${stats.topProduct[1]})` : "Belum ada",
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Stok Rendah",
      value: `${stats.lowStock.length} produk`,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low stock alert */}
      {stats.lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <div className="flex items-center gap-3">
                    <img src={getProductImage(p)} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    Sisa: {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{o.customerName || "Pelanggan"}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {o.items.length} item · Rp {o.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    o.status === "completed" ? "bg-primary/10 text-primary" :
                    o.status === "pending" ? "bg-accent/10 text-accent" :
                    "bg-info/10 text-info"
                  }`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
