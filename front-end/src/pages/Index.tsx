import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import {
  ShoppingBag,
  LayoutDashboard,
  Zap,
  Package,
  TrendingUp,
  Users,
  Truck,
  MapPin,
  Store,
  Barcode,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const stats = [
  { value: "Banyak Toko", label: "Satu platform untuk seluruh wilayah" },
  { value: "POS + Online", label: "Penjualan terpadu" },
  { value: "Peta Lokasi", label: "Cari toko & titik antar dengan mudah" },
];

const steps = [
  {
    step: "01",
    title: "Pilih toko",
    desc: "Jelajahi daftar toko terdekat atau temukan lewat peta interaktif di area Anda.",
    icon: MapPin,
  },
  {
    step: "02",
    title: "Belanja & checkout",
    desc: "Keranjang per toko, ongkir desa tetap, bayar COD atau transfer manual.",
    icon: ShoppingBag,
  },
  {
    step: "03",
    title: "Lacak pesanan",
    desc: "Status dari menunggu hingga selesai — pickup atau antar kurir internal.",
    icon: Package,
  },
];

const roles = [
  {
    icon: LayoutDashboard,
    title: "Admin Toko & Kasir",
    desc: "Kelola katalog, stok, POS barcode, pesanan online, dan laporan penjualan per toko.",
    link: "/admin",
    borderAccent: "border-t-primary",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    icon: ShoppingBag,
    title: "Pelanggan",
    desc: "Pilih toko, tambah ke keranjang, checkout dengan peta alamat pengiriman.",
    link: "/stores",
    borderAccent: "border-t-accent",
    iconBg: "bg-accent/15 text-accent",
  },
  {
    icon: Truck,
    title: "Kurir Internal",
    desc: "Terima tugas antar dari toko yang sama, perbarui status pengiriman real-time.",
    link: "/courier",
    borderAccent: "border-t-info",
    iconBg: "bg-info/15 text-info",
  },
];

const features = [
  {
    icon: Barcode,
    title: "POS & Barcode",
    desc: "Transaksi kasir cepat dengan scanner dan struk cetak.",
    span: "sm:col-span-2",
  },
  {
    icon: Store,
    title: "Banyak Toko",
    desc: "Data terisolasi per toko — aman untuk banyak pemilik warung.",
    span: "",
  },
  {
    icon: Package,
    title: "Stok Otomatis",
    desc: "Stok berkurang saat POS maupun pesanan online, tercatat di riwayat.",
    span: "",
  },
  {
    icon: TrendingUp,
    title: "Laporan & Insight",
    desc: "Pisahkan omzet offline vs online, alert stok menipis, unduh laporan.",
    span: "sm:col-span-2",
  },
];

const HeroPreview = () => (
  <div className="relative mx-auto w-full max-w-md lg:max-w-none">
    <div className="absolute -left-8 top-8 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
    <div className="absolute -right-4 bottom-4 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

    <div className="relative space-y-4">
      <div className="animate-float ml-auto w-[88%] rounded-2xl border border-border/60 bg-card p-4 shadow-xl shadow-secondary/10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Pilih toko</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            12 toko aktif
          </span>
        </div>
        {["Warung Mama Eva", "Toko Sumber Rejeki", "Mart Sejahtera"].map((name, i) => (
          <div
            key={name}
            className={`mb-2 flex items-center gap-3 rounded-xl border p-2.5 ${i === 0 ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="text-[10px] text-muted-foreground">Dekat Anda</p>
            </div>
            {i === 0 && <ChevronRight className="h-4 w-4 text-primary" />}
          </div>
        ))}
      </div>

      <div className="animate-float w-[75%] rounded-2xl border border-border/60 bg-card p-4 shadow-lg [animation-delay:1s]">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-foreground">Kasir POS</span>
        </div>
        <div className="space-y-1.5">
          {[
            { item: "Es Teh Manis", price: "Rp 5.000" },
            { item: "Nasi Goreng", price: "Rp 15.000" },
          ].map((row) => (
            <div key={row.item} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{row.item}</span>
              <span className="font-medium text-foreground">{row.price}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t pt-2 text-sm font-bold text-primary">
            <span>Total</span>
            <span>Rp 20.000</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <WarungSyncLogo size="md" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#cara-kerja" className="transition-colors hover:text-foreground">
              Cara Kerja
            </a>
            <a href="#panel" className="transition-colors hover:text-foreground">
              Panel Pengguna
            </a>
            <a href="#fitur" className="transition-colors hover:text-foreground">
              Fitur
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
            <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" asChild>
              <Link to="/stores">
                Mulai Belanja
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />

        <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-up text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Platform digitalisasi warung & toko UMKM
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Satu hub untuk{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                toko lokal
              </span>{" "}
              & belanja online
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              POS offline, toko online, dan pengiriman dalam satu aplikasi.
              Pelanggan memilih toko dulu — keranjang tidak pernah tercampur antar toko.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button size="lg" className="h-12 gap-2 px-8 text-base shadow-lg shadow-primary/25" asChild>
                <Link to="/stores">
                  <ShoppingBag className="h-5 w-5" />
                  Pilih Toko & Belanja
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 gap-2 px-8 text-base" asChild>
                <Link to="/login">
                  <Users className="h-5 w-5" />
                  Masuk ke Akun
                </Link>
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
              {["Bayar COD atau transfer", "Ongkir per desa", "Tandai lokasi antar di peta"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="animate-fade-up [animation-delay:150ms] lg:pl-4">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-secondary text-secondary-foreground">
        <div className="container mx-auto grid gap-8 px-4 py-10 sm:grid-cols-3 sm:gap-4 sm:py-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-secondary-foreground/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Cara kerja</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              Belanja online yang jelas & terstruktur
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div
                    className="absolute left-1/2 top-12 hidden h-px w-full bg-gradient-to-r from-border via-primary/30 to-border md:block"
                    aria-hidden
                  />
                )}
                <div className="relative rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                  <span className="font-display text-4xl font-bold text-primary/20">{s.step}</span>
                  <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="panel" className="bg-muted/40 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Tiga peran, satu platform
            </h2>
            <p className="mt-3 text-muted-foreground">
              Setiap pengguna masuk ke panel yang sesuai tugasnya.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <Link
                key={r.title}
                to={r.link}
                className={`group relative overflow-hidden rounded-2xl border border-border border-t-4 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${r.borderAccent}`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${r.iconBg}`}>
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Buka panel
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="fitur" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Fitur utama</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                Dibangun untuk operasional harian warung
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/stores" className="gap-2">
                Lihat toko terdaftar
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md ${f.span}`}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-secondary px-6 py-14 text-center md:px-16 md:py-20">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.35),transparent_55%)]"
              aria-hidden
            />
            <div className="relative">
              <WarungSyncLogo size="lg" className="mx-auto justify-center [&_span]:text-secondary-foreground [&_span:last-child]:text-secondary-foreground/70" />
              <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold text-secondary-foreground md:text-4xl">
                Siap mengembangkan warung Anda dengan WarungSync?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-secondary-foreground/75">
                Mulai dari memilih toko favorit Anda, atau masuk sebagai admin/kurir untuk mengelola operasional.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="h-12 gap-2 px-8 shadow-lg" asChild>
                  <Link to="/stores">
                    Jelajahi Toko
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-secondary-foreground/20 bg-transparent px-8 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                  asChild
                >
                  <Link to="/admin">Panel Admin</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
          <WarungSyncLogo size="sm" />
          <p className="text-center text-sm text-muted-foreground md:text-right">
            © 2026 WarungSync — Platform POS & toko online untuk UMKM.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
