import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
  Truck,
  Store,
  Barcode,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  UserPlus,
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
    icon: Store,
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
    link: "/login",
    borderAccent: "border-t-primary",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    icon: ShoppingBag,
    title: "Pelanggan",
    desc: "Pilih toko, tambah ke keranjang, checkout dengan peta alamat pengiriman.",
    link: "/login",
    borderAccent: "border-t-accent",
    iconBg: "bg-accent/15 text-accent",
  },
  {
    icon: Truck,
    title: "Kurir Internal",
    desc: "Terima tugas antar dari toko yang sama, perbarui status pengiriman real-time.",
    link: "/login",
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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <WarungSyncLogo size="md" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#cara-kerja"
              className="transition-colors hover:text-foreground"
            >
              Cara Kerja
            </a>
            <a
              href="#panel"
              className="transition-colors hover:text-foreground"
            >
              Panel Pengguna
            </a>
            <a
              href="#fitur"
              className="transition-colors hover:text-foreground"
            >
              Fitur
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              asChild
            >
              <Link to="/login">Masuk</Link>
            </Button>
            <Button
              size="sm"
              className="gap-1.5 shadow-md shadow-primary/20"
              asChild
            >
              <Link to="/register">
                Daftar
                <UserPlus className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero - REDESIGN: Center Aligned (Satu Kolom) */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Latar Belakang Dekoratif (Soft Gradients) */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.15),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="container relative mx-auto px-4 flex flex-col items-center text-center">
          <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Platform digitalisasi warung & toko UMKM
          </div>

          <h1 className="animate-fade-up [animation-delay:100ms] max-w-4xl font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4rem]">
            Satu platform untuk{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              toko lokal
            </span>{" "}
            & belanja online
          </h1>

          <p className="animate-fade-up [animation-delay:200ms] mx-auto mt-6 max-w-2xl text-lg md:text-xl leading-relaxed text-muted-foreground">
            POS offline, toko online, dan pengiriman dalam satu aplikasi.
            Pelanggan memilih toko dulu — keranjang tidak pernah tercampur antar
            toko.
          </p>

          <div className="animate-fade-up [animation-delay:300ms] mt-10 flex flex-col items-center gap-4 sm:flex-row w-full sm:w-auto px-4 sm:px-0">
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto gap-2 px-8 text-base shadow-xl shadow-primary/25 rounded-xl"
              asChild
            >
              <Link to="/login">
                <ShoppingBag className="h-5 w-5" />
                Mulai Belanja Sekarang
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full sm:w-auto gap-2 px-8 text-base rounded-xl border-border/80"
              asChild
            >
              <Link to="/register">
                <Store className="h-5 w-5" />
                Daftarkan Toko Anda
              </Link>
            </Button>
          </div>

          <ul className="animate-fade-up [animation-delay:400ms] mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
            {[
              "Transaksi Aman & Cepat",
              "Sistem Inventaris Akurat",
              "Dukungan Kurir Internal",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-primary/20 text-secondary-foreground relative z-10">
        <div className="container mx-auto grid gap-8 px-4 py-12 sm:grid-cols-3 sm:gap-4 lg:py-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm md:text-base font-medium text-secondary-foreground/80">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Cara kerja
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              Belanja online yang jelas & terstruktur
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.step} className="relative group">
                {i < steps.length - 1 && (
                  <div
                    className="absolute left-[60%] top-12 hidden h-px w-[80%] bg-gradient-to-r from-border via-primary/30 to-border md:block"
                    aria-hidden
                  />
                )}
                <div className="relative rounded-3xl border border-border/50 bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <span className="font-display text-5xl font-black text-primary/10 transition-colors group-hover:text-primary/20">
                    {s.step}
                  </span>
                  <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section
        id="panel"
        className="bg-muted/30 py-20 md:py-32 border-y border-border/50"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Tiga peran, satu ekosistem
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Setiap pengguna masuk ke panel khusus yang dirancang sesuai
              tugasnya.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <Link
                key={r.title}
                to={r.link}
                className={`group relative overflow-hidden rounded-3xl border border-border border-t-4 bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${r.borderAccent}`}
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${r.iconBg}`}
                >
                  <r.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {r.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {r.desc}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                  Masuk sekarang
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="fitur" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Fitur utama
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
              Dirancang khusus untuk operasional harian warung
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-3xl border border-border/50 bg-card p-8 transition-all hover:shadow-lg ${f.span}`}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 md:pb-32 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-20 text-center md:px-16 shadow-2xl">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.2),transparent_60%)]"
              aria-hidden
            />
            <div className="relative z-10 max-w-3xl mx-auto">
              <WarungSyncLogo
                size="lg"
                className="mx-auto justify-center [&_span]:text-background [&_span:last-child]:text-background/70 mb-8"
              />
              <h2 className="font-display text-3xl font-extrabold text-background md:text-5xl leading-tight">
                Mulai kembangkan warung Anda hari ini.
              </h2>
              <p className="mt-6 text-lg text-background/80">
                Bergabunglah sebagai pemilik toko untuk mengelola operasional,
                atau daftar sebagai pelanggan untuk mulai berbelanja di warung
                sekitar Anda.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-14 gap-2 px-10 text-base shadow-xl rounded-xl w-full sm:w-auto"
                  asChild
                >
                  <Link to="/register">
                    Daftar Sekarang
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 gap-2 px-10 text-base rounded-xl w-full sm:w-auto bg-transparent text-background border-background/20 hover:bg-background/10 hover:text-background"
                  asChild
                >
                  <Link to="/login">Masuk ke Akun</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-12 md:flex-row">
          <WarungSyncLogo size="sm" />
          <p className="text-center text-sm font-medium text-muted-foreground md:text-right">
            © {new Date().getFullYear()} WarungSync. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
