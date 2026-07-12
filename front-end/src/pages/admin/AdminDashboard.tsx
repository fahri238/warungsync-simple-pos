import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Store,
  Users,
  UserCheck,
  Bike,
  Package,
  ShoppingCart,
  TrendingUp,
  Activity,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSession, apiFetch } from "@/lib/store";

const AdminDashboard = () => {
  const session = getSession();

  const [data, setData] = useState({
    totals: {
      tenant: 0,
      owner: 0,
      pelanggan: 0,
      kurir: 0,
      produk: 0,
      pesanan: 0,
      komisi: 0, // State baru untuk menampung pendapatan admin
    },
    chartTransaksi: [],
    chartPengguna: [],
    aktivitasTerbaru: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || session.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/admin/stats-full");
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error: any) {
        console.warn("Backend API belum siap, menggunakan data kosong.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.id]);

  if (!session || session.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-[2rem] overflow-hidden relative">
          <div className="h-2 bg-destructive w-full absolute top-0 left-0"></div>
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/5">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-foreground">
              Akses Ditolak
            </h2>
            <p className="mb-8 text-muted-foreground text-sm px-4">
              Anda tidak memiliki otoritas tingkat Admin untuk mengakses Sistem
              Kontrol Pusat.
            </p>
            <Button
              asChild
              className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20"
            >
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
        <Activity className="h-10 w-10 animate-bounce mb-2 opacity-50 text-primary" />
        <p className="text-sm font-medium">
          Sinkronisasi data sistem global...
        </p>
      </div>
    );
  }

  const formatRupiah = (angka: number) =>
    `Rp ${Number(angka).toLocaleString("id-ID")}`;

  const statCards = [
    {
      title: "Total Toko (Tenant)",
      value: data.totals.tenant,
      icon: Store,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Owner",
      value: data.totals.owner,
      icon: UserCheck,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Total Pelanggan",
      value: data.totals.pelanggan,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Kurir",
      value: data.totals.kurir,
      icon: Bike,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Total Produk",
      value: data.totals.produk,
      icon: Package,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Pesanan",
      value: data.totals.pesanan,
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Banner Utama & Pendapatan Sistem */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-2 rounded-3xl bg-primary/5 p-6 md:p-8 border border-primary/10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground relative z-10">
            Sistem Kontrol Pusat
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm md:text-base leading-relaxed relative z-10">
            Selamat bertugas, <strong>{session.name}</strong>. Pantau kesehatan
            ekosistem WarungSync, mulai dari pertumbuhan pengguna, tenant,
            hingga lalu lintas transaksi hari ini.
          </p>
        </div>

        {/* KARTU KOMISI (PENDAPATAN ADMIN) */}
        <Card className="rounded-3xl border-green-500/30 bg-green-500/5 shadow-md shadow-green-500/5 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-green-500/10 blur-xl pointer-events-none"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider">
                Pendapatan Sistem (5%)
              </p>
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-green-600 tracking-tight">
              {formatRupiah(data.totals.komisi)}
            </h3>
            <p className="text-xs font-medium text-green-700/70 mt-2">
              Akumulasi keuntungan dari transaksi yang diselesaikan.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid 6 Kartu Statistik */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((c) => (
          <Card
            key={c.title}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-col items-center justify-center p-4 pb-2 text-center gap-2">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg}`}
              >
                <c.icon className={`h-6 w-6 ${c.color}`} />
              </div>
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-4">
              <div className="text-3xl font-black text-foreground">
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid Grafik */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grafik Transaksi */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">
                Lalu Lintas Transaksi
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Volume pesanan seluruh toko dalam 7 hari terakhir.
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {data.chartTransaksi.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
                  Menunggu data grafik transaksi dari server...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.chartTransaksi}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPesanan"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPesanan)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grafik Pertumbuhan Pengguna */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">
                Pertumbuhan Pengguna Baru
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Registrasi user (Pelanggan, Kurir, Owner) per bulan.
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {data.chartPengguna.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
                  Menunggu data grafik pertumbuhan dari server...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.chartPengguna}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
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
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#22c55e" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aktivitas Terbaru Sistem */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Log Aktivitas Terbaru
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau pergerakan transaksi dan registrasi terbaru di seluruh
            sistem.
          </p>
        </CardHeader>
        <CardContent>
          {data.aktivitasTerbaru.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Belum ada log aktivitas yang tercatat hari ini.
            </div>
          ) : (
            <div className="space-y-4">
              {data.aktivitasTerbaru.map((log: any, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${log.type === "register" ? "bg-green-500" : "bg-primary"}`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {log.pesan}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.waktu}</p>
                  </div>
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
