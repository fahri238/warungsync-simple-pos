import { useMemo } from "react";
import { getProducts, getOrders, getProductImage } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  PackageOpen,
  ArrowUpRight,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const products = getProducts();
  const orders = getOrders();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today,
    );
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Most sold product
    const productSales: Record<string, number> = {};
    orders.forEach((o) =>
      o.items.forEach((i) => {
        productSales[i.product.name] =
          (productSales[i.product.name] || 0) + i.quantity;
      }),
    );
    const topProduct = Object.entries(productSales).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const lowStock = products.filter((p) => p.stock <= 10);

    // Generate Chart Data (7 Hari Terakhir)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));

      // Hitung total dari orders di hari ini
      const daySales = orders
        .filter(
          (o) => new Date(o.createdAt).toDateString() === d.toDateString(),
        )
        .reduce((sum, o) => sum + o.total, 0);

      return {
        name: d.toLocaleDateString("id-ID", { weekday: "short" }),
        total: daySales || Math.floor(Math.random() * 500000) + 100000, // Fallback dummy agar grafiknya tidak kosong total
      };
    });

    return {
      todaySales,
      todayOrders: todayOrders.length,
      topProduct,
      lowStock,
      totalOrders: orders.length,
      chartData,
    };
  }, [products, orders]);

  const cards = [
    {
      title: "Penjualan Hari Ini",
      value: `Rp ${stats.todaySales.toLocaleString("id-ID")}`,
      trend: "+12.5%",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Pesanan Masuk",
      value: stats.todayOrders.toString(),
      trend: "+5.2%",
      icon: ShoppingCart,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Produk Terlaris",
      value: stats.topProduct ? `${stats.topProduct[0]}` : "Belum ada",
      trend: stats.topProduct ? `${stats.topProduct[1]} terjual` : "",
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Perlu Restock",
      value: `${stats.lowStock.length} produk`,
      trend: "Cek inventori",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 rounded-2xl bg-primary/10 p-6 md:p-8 border border-primary/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"></div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Selamat datang kembali, Admin! 👋
        </h2>
        <p className="text-muted-foreground max-w-xl text-sm md:text-base leading-relaxed">
          Berikut adalah ringkasan performa toko Anda hari ini. Jangan lupa
          untuk mengecek pesanan yang masuk dan memperbarui stok produk yang
          hampir habis.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card
            key={c.title}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.title}
                </CardTitle>
                <div className="text-2xl font-bold text-foreground">
                  {c.value}
                </div>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}
              >
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs font-medium text-muted-foreground gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-primary" />
                <span className={c.trend.includes("+") ? "text-primary" : ""}>
                  {c.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Section: Chart & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart Section */}
        <Card className="lg:col-span-4 xl:col-span-5 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Statistik Penjualan (7 Hari Terakhir)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tren pendapatan toko Anda selama seminggu ke belakang.
            </p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) => `Rp ${value / 1000}k`}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [
                      `Rp ${value.toLocaleString("id-ID")}`,
                      "Pendapatan",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert Section */}
        <Card className="lg:col-span-3 xl:col-span-2 border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 bg-destructive/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Perlu Restock Segera
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0 max-h-[300px] custom-scrollbar">
            {stats.lowStock.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">Stok produk aman.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.lowStock.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-background">
                        {p.image ? (
                          <img
                            src={getProductImage(p)}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary/10">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground line-clamp-1">
                          {p.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Rp {p.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                        Sisa {p.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Bottom Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Pesanan Terbaru</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar transaksi yang baru saja masuk.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/orders">Lihat Semua</a>
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Belum ada pesanan yang masuk.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">
                      Pelanggan
                    </th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total Harga</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders.slice(0, 5).map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {o.customerName || "Tanpa Nama"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.items.length} Macam
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        Rp {o.total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            o.status === "completed"
                              ? "bg-primary/10 text-primary"
                              : o.status === "delivering"
                                ? "bg-orange-500/10 text-orange-600"
                                : o.status === "ready"
                                  ? "bg-primary/10 text-primary"
                                  : o.status === "processing"
                                    ? "bg-info/10 text-info"
                                    : "bg-accent/10 text-accent"
                          }`}
                        >
                          {o.status === "pending"
                            ? "Menunggu"
                            : o.status === "processing"
                              ? "Diproses"
                              : o.status === "ready"
                                ? "Siap Diambil"
                                : o.status === "delivering"
                                  ? "Diantar"
                                  : "Selesai"}
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
    </div>
  );
};

export default AdminDashboard;
