import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  LayoutDashboard,
  Truck,
  MapPin,
  Barcode,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const highlights = [
  {
    icon: LayoutDashboard,
    title: "Admin & Kasir",
    desc: "Kelola produk, POS, dan pesanan toko Anda.",
  },
  {
    icon: ShoppingBag,
    title: "Pelanggan",
    desc: "Belanja dari toko pilihan dan lacak pesanan.",
  },
  {
    icon: Truck,
    title: "Kurir",
    desc: "Terima tugas antar dan perbarui status pengiriman.",
  },
];

const perks = [
  { icon: Barcode, text: "Kasir cepat dengan scan barcode" },
  { icon: MapPin, text: "Peta toko & lokasi antar" },
  { icon: CheckCircle2, text: "Satu akun, panel sesuai peran" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      toast.error("Isi email dan password");
      return;
    }

    try {
      setSubmitting(true);
      const userData = await login(email, password);
      toast.success(`Selamat datang, ${userData.name}!`);
      
      // PERBAIKAN LOGIKA ROUTING: Eksplisit menangkap role bahasa Indonesia
      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "owner") {
        navigate("/owner");
      } else if (userData.role === "kurir" || userData.role === "courier") {
        navigate("/courier");
      } else if (userData.role === "pelanggan" || userData.role === "customer") {
        navigate("/customer");
      } else {
        // Fallback terakhir jika terjadi anomali peran di database
        toast.error("Peran pengguna tidak dikenal oleh sistem.");
      }

    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Email atau password salah";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-secondary lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,hsl(var(--primary)/0.4),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-1 flex-col justify-center px-10 py-12 xl:px-16">
          <WarungSyncLogo
            size="lg"
            className="[&_span]:text-secondary-foreground [&_span:last-child]:text-secondary-foreground/70"
          />

          <h1 className="mt-10 font-display text-3xl font-bold leading-tight text-secondary-foreground xl:text-4xl">
            Kelola warung & <span className="text-primary">jualan online</span>{" "}
            dalam satu tempat
          </h1>

          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li
                key={p.text}
                className="flex items-center gap-3 text-sm text-secondary-foreground/90"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <p.icon className="h-4 w-4 text-primary" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-3">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="flex items-start gap-3 rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-4 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-secondary-foreground">
                    {h.title}
                  </p>
                  <p className="mt-0.5 text-sm text-secondary-foreground/70">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-auto text-xs text-secondary-foreground/50">
            © 2026 WarungSync — Platform untuk UMKM di berbagai wilayah.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-background">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)] lg:hidden"
          aria-hidden
        />

        <div className="relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-6 gap-1.5 text-muted-foreground"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke beranda
              </Link>
            </Button>

            <div className="mb-8 lg:hidden">
              <WarungSyncLogo size="md" />
            </div>

            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Selamat datang kembali
              </h2>
              <p className="mt-2 text-muted-foreground">
                Masuk dengan akun WarungSync Anda untuk melanjutkan.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-base shadow-md shadow-primary/20"
                disabled={submitting || loading}
              >
                {submitting ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;