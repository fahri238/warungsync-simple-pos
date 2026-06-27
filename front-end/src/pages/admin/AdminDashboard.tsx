import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProductImage, getSession, apiFetch } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  PackageOpen,
  ArrowUpRight,
  Package,
  ShieldAlert,
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
import type { Product, Order } from "@/types";
import { toast } from "sonner";

const AdminDashboard = () => {
  const session = getSession();

  // State dinamis untuk menampung data riil dari Database Backend
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Ambil data produk dan pesanan berdasarkan hak akses Store ID Admin yang sedang login
  useEffect(() => {
    if (!session || session.role !== "admin" || !session.store_id) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Tembak API produk berdasarkan storeId
        const productsRes = await apiFetch(`/products?storeId=${session.store_id}`);
        setProducts(productsRes.data || []);

        // 2. Tembak API pesanan berdasarkan storeId
        const ordersRes = await apiFetch(`/orders?storeId=${session.store_id}`);
        setOrders(ordersRes.data || []);
      } catch (error: any) {
        console.error("Gagal memuat data dasbor admin:", error);
        toast.error(error?.message || "Gagal menyinkronkan data ke server");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.store_id]);

  // Kalkulasi statistik laporan penjualan toko menggunakan useMemo
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today,
    );
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Hitung produk paling banyak terjual
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

    // Generate Chart Data (7 Hari Terakhir) dari histori transaksi riil database
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));

      const daySales = orders
        .filter(
          (o) => new Date(o.createdAt).toDateString() === d.toDateString(),
        )
        .reduce((sum, o) => sum + o.total, 0);

      return {
        name: d.toLocaleDateString("id-ID", { weekday: "short" }),
        total: daySales,
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

  // PENGECEKAN KEAMANAN (Akses Ditolak jika bukan Admin)
  if (!session || session.role !== "admin") {
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
              Sesi admin Anda tidak ditemukan atau Anda tidak memiliki izin untuk mengakses halaman ini.
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
      <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground">
        <Package className="h-10 w-10 animate-bounce mb-2 opacity-50 text-primary" />
        <p className="text-sm font-medium">Memuat statistik performa toko...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Penjualan Hari Ini",
      value: `Rp ${stats.todaySales.toLocaleString("id-ID")}`,
      trend: "Data Aktual",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Pesanan Masuk",
      value: stats.todayOrders.toString(),
      trend: "Hari ini",
      icon: ShoppingCart,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Produk Terlaris",
      value: stats.topProduct ? `${stats.topProduct[0]}` : "Belum ada",
      trend: stats.topProduct ? `${stats.topProduct[1]} terjual` : "Belum ada transaksi",
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Perlu Restock",
      value: `${stats.lowStock.length} produk`,
      trend: "Stok m-10",
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
          Selamat datang kembali, {session.name.split(' ')[0]}! 👋
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
                <span className="text-primary">
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
            <Link to="/admin/orders">Lihat Semua</Link>
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
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Pelanggan</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total Harga</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Status</th>
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