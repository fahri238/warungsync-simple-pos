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
  MapPin,
  Barcode,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const perks = [
  { icon: Barcode, text: "POS & barcode" },
  { icon: MapPin, text: "Peta toko & antar" },
  { icon: CheckCircle2, text: "Multi-peran" },
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
      if (userData.role === "admin") navigate("/admin");
      else if (userData.role === "courier") navigate("/courier");
      else navigate("/customer");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Email atau password salah";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid h-dvh max-h-dvh overflow-hidden lg:grid-cols-2">
      {/* Brand panel — compact, no scroll */}
      <div className="relative hidden h-full flex-col overflow-hidden bg-secondary lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_15%_0%,hsl(var(--primary)/0.45),transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between px-8 py-8 xl:px-12">
          <div>
            <WarungSyncLogo
              size="md"
              className="[&_span]:text-secondary-foreground [&_span:last-child]:text-secondary-foreground/65"
            />
            <h1 className="mt-6 font-display text-2xl font-bold leading-snug text-secondary-foreground xl:text-3xl">
              Satu platform untuk{" "}
              <span className="text-primary">warung & toko online</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-secondary-foreground/75">
              Admin, pelanggan, dan kurir — semua terhubung dalam WarungSync.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {perks.map((p) => (
                <span
                  key={p.text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-secondary-foreground/15 bg-secondary-foreground/5 px-3 py-1.5 text-xs font-medium text-secondary-foreground/90"
                >
                  <p.icon className="h-3.5 w-3.5 text-primary" />
                  {p.text}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-secondary-foreground/45">
            © 2026 WarungSync
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-4 py-4 sm:px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-muted-foreground" asChild>
                <Link to="/">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Beranda
                </Link>
              </Button>
              <div className="lg:hidden">
                <WarungSyncLogo size="sm" />
              </div>
            </div>

            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Masuk
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Gunakan akun WarungSync Anda
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-md shadow-primary/5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="h-10 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full shadow-md shadow-primary/20"
                disabled={submitting || loading}
              >
                {submitting ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Daftar
              </Link>
            </p>

            <Button variant="link" size="sm" className="mt-1 w-full gap-1 text-muted-foreground" asChild>
              <Link to="/stores">
                <ShoppingBag className="h-3.5 w-3.5" />
                Belanja tanpa login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
