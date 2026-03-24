import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, LayoutDashboard, Zap, Package, TrendingUp, Users, Truck } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xl">
              🏪
            </div>
            <span className="text-xl font-bold text-foreground">WarungSync</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/store">Belanja</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/admin">Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl animate-slide-in">
          <div className="mb-6 text-6xl">🏪</div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Simplifying Small Business Operations
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Sistem POS & E-commerce terintegrasi untuk warung dan toko kecil. 
            Kelola penjualan, stok, dan pesanan online dalam satu platform.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8 text-base" asChild>
              <Link to="/store"><ShoppingBag className="h-5 w-5" />Mulai Belanja</Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 text-base" asChild>
              <Link to="/admin"><LayoutDashboard className="h-5 w-5" />Dashboard Admin</Link>
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 px-8 text-base" asChild>
              <Link to="/login"><Users className="h-5 w-5" />Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t bg-card py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">3 Panel Pengguna</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: LayoutDashboard, title: "Admin / Kasir", desc: "Dashboard, POS, kelola produk, stok, pesanan, dan laporan", link: "/admin", color: "text-primary" },
              { icon: ShoppingBag, title: "Customer", desc: "Belanja online, keranjang, checkout, dan tracking pesanan", link: "/store", color: "text-accent" },
              { icon: Truck, title: "Kurir", desc: "Lihat pengiriman, detail pesanan, dan update status", link: "/courier", color: "text-info" },
            ].map((r) => (
              <Link key={r.title} to={r.link} className="rounded-xl border bg-background p-6 transition-shadow hover:shadow-lg group">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <r.icon className={`h-6 w-6 ${r.color}`} />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">Fitur Utama</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "POS Cepat", desc: "Kasir instan dengan pencarian produk dan keranjang real-time" },
              { icon: ShoppingBag, title: "Toko Online", desc: "Pelanggan bisa pesan langsung dari HP mereka" },
              { icon: Package, title: "Kelola Stok", desc: "Pantau stok otomatis berkurang setiap transaksi" },
              { icon: TrendingUp, title: "Laporan", desc: "Laporan penjualan harian, produk terlaris, dan lainnya" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 WarungSync. Built for small businesses.</p>
      </footer>
    </div>
  );
};

export default Index;
