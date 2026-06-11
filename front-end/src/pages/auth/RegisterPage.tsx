import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  LayoutDashboard,
  Truck,
  Store,
  MapPin,
  User,
  Phone,
  CheckCircle, } from "lucide-react";
import { toast } from "sonner";

const highlights = [
  {
    icon: LayoutDashboard,
    title: "Admin & Kasir",
    desc: "Kelola inventaris, POS, dan pesanan masuk dari satu dasbor terpusat.",
  },
  {
    icon: ShoppingBag,
    title: "Pelanggan",
    desc: "Eksplorasi katalog warung sekitar dan pesan barang dari rumah.",
  },
  {
    icon: Truck,
    title: "Kurir",
    desc: "Sistem navigasi peta bawaan untuk mengantar pesanan lebih cepat.",
  },
];

const RegisterPage = () => {
  type Role = "customer" | "courier" | "store-owner";

  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [homeAddress, setHomeAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const state = location.state as {
      latitude?: number;
      longitude?: number;
    } | null;

    if (state?.latitude != null && state?.longitude != null) {
      setLatitude(state.latitude);
      setLongitude(state.longitude);
    }
  }, [location.state]);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name || !email || !password || !phone) {
      toast.error("Isi semua field yang diwajibkan");
      return;
    }

    if (role === "courier" && !homeAddress) {
      toast.error("Kurir wajib mengisi alamat lengkap");
      return;
    }

    if (role === "customer" && !homeAddress) {
      toast.error("Pembeli wajib mengisi alamat rumah");
      return;
    }

    if (role === "store-owner" && (!storeName || !storeAddress)) {
      toast.error("Pemilik toko wajib mengisi nama dan alamat toko");
      return;
    }

    if (
      (role === "customer" || role === "store-owner") &&
      (latitude == null || longitude == null)
    ) {
      toast.error("Pilih lokasi di peta sebelum melanjutkan");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name,
        email,
        password,
        phone,
        role,
      };

      if (role === "courier") {
        payload.address = homeAddress;
      }

      if (role === "customer") {
        payload.address = homeAddress;
        payload.latitude = latitude;
        payload.longitude = longitude;
      }

      if (role === "store-owner") {
        payload.storeName = storeName;
        payload.address = storeAddress;
        payload.latitude = latitude;
        payload.longitude = longitude;
      }

      const user = await register(payload);
      toast.success("Akun berhasil dibuat!");
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "courier") navigate("/courier");
      else navigate("/customer");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen overflow-hidden lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-secondary lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,hsl(var(--primary)/0.25),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-1 flex-col px-10 py-12 xl:px-16 overflow-y-auto custom-scrollbar">
          {/* Logo */}
          <div className="mb-10">
            <WarungSyncLogo
              size="lg"
              className="[&_span]:text-secondary-foreground [&_span:last-child]:text-secondary-foreground/70"
            />
          </div>

          {/* Hero Content */}
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold leading-[1.15] text-secondary-foreground xl:text-5xl">
              Satu Aplikasi untuk <br />
              <span className="text-primary">Semua Kebutuhan</span> Warung Anda.
            </h1>
            <p className="mt-5 text-lg text-secondary-foreground/80 leading-relaxed">
              Bergabunglah dengan ekosistem WarungSync. Mulai dari kelola stok,
              layani kasir, hingga antar pesanan online dengan Geomapping.
            </p>

            {/* Micro Stats */}
            <div className="mt-8 flex items-center gap-6 border-b border-secondary-foreground/10 pb-8">
              <div>
                <h4 className="text-3xl font-bold text-primary">3</h4>
                <p className="text-sm font-medium text-secondary-foreground/80 mt-1">
                  Pilihan Peran
                </p>
              </div>
              <div className="h-10 w-px bg-secondary-foreground/20"></div>
              <div>
                <h4 className="text-3xl font-bold text-primary">100%</h4>
                <p className="text-sm font-medium text-secondary-foreground/80 mt-1">
                  Terintegrasi
                </p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mt-8 grid gap-4 max-w-md">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="group flex items-start gap-4 rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-4 backdrop-blur-sm transition-all hover:bg-secondary-foreground/10"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <h.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-secondary-foreground">
                    {h.title}
                  </p>
                  <p className="mt-1 text-sm text-secondary-foreground/70 leading-relaxed">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs font-medium text-secondary-foreground/40">
            © 2026 WarungSync — Platform untuk UMKM.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-background overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)] lg:hidden"
          aria-hidden
        />

        <div className="relative flex flex-1 min-h-0 flex-col justify-center px-4 py-8 sm:px-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
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
                Daftar Akun Baru
              </h2>
              <p className="mt-2 text-muted-foreground">
                Lengkapi data di bawah ini untuk bergabung dengan WarungSync.
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8"
            >
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pilih Peran Anda
                </Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as Role)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                >
                  <div>
                    <RadioGroupItem
                      value="customer"
                      id="r-customer"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="r-customer"
                      className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-muted bg-transparent p-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center"
                    >
                      <ShoppingBag className="h-5 w-5 shrink-0" />
                      <span className="font-medium leading-tight">Pembeli</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="store-owner"
                      id="r-store-owner"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="r-store-owner"
                      className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-muted bg-transparent p-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center"
                    >
                      <Store className="h-5 w-5 shrink-0" />
                      <span className="font-medium leading-tight">
                        Pemilik Toko
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="courier"
                      id="r-courier"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="r-courier"
                      className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-muted bg-transparent p-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center"
                    >
                      <Truck className="h-5 w-5 shrink-0" />
                      <span className="font-medium leading-tight">Kurir</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-5 lg:grid-cols-1">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama Anda"
                          autoComplete="name"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nama@email.com"
                          autoComplete="username"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. HP</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08xxxxxxxxx"
                          autoComplete="tel"
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
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="h-11 pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {(role === "customer" || role === "courier") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="home-address">
                        {role === "courier" ? "Alamat Kurir" : "Alamat Rumah"}
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="home-address"
                          value={homeAddress}
                          onChange={(e) => setHomeAddress(e.target.value)}
                          placeholder={
                            role === "courier"
                              ? "Alamat lengkap kurir"
                              : "Alamat rumah Anda"
                          }
                          autoComplete="street-address"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  )}

                  {role === "store-owner" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label htmlFor="store-name">Nama Toko</Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="store-name"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="Nama toko Anda"
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="store-address">Alamat Toko</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="store-address"
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            placeholder="Alamat lengkap toko"
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-11 w-full text-base shadow-md shadow-primary/20"
                    disabled={submitting || loading}
                  >
                    {submitting ? "Memproses..." : "Daftar Sekarang"}
                  </Button>
                </div>

                <div className="space-y-5">
                  {role === "customer" || role === "store-owner" ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
                      <MapPin className="absolute -bottom-4 -right-4 h-24 w-24 text-primary/10" />
                      <Label className="text-base font-semibold text-primary flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Titik Lokasi Peta
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground relative z-10">
                        {role === "customer"
                          ? "Tentukan titik rumah Anda di peta agar kurir mudah menemukan alamat saat pengiriman."
                          : "Tentukan lokasi toko Anda di peta agar pelanggan mudah menemukannya."}
                      </p>
                      <Button
                        type="button"
                        variant={latitude ? "outline" : "default"}
                        className="mt-4 h-11 w-full relative z-10"
                        onClick={() =>
                          navigate(`/register/location?role=${role}`, {
                            state: { latitude, longitude },
                          })
                        }
                      >
                        {latitude != null && longitude != null
                          ? "Ubah Lokasi di Peta"
                          : "Pilih Lokasi di Peta"}
                      </Button>
                      {latitude != null && longitude != null ? (
                        <div className="mt-3 inline-block rounded-md bg-background px-3 py-1.5 border text-xs font-mono text-muted-foreground relative z-10">
                          {latitude.toFixed(5)}, {longitude.toFixed(5)}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    // Memperbaiki kotak informasi kurir agar lebih kontras di light & dark mode
                    <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/50 p-4 text-center">
                      <p className="text-sm text-foreground flex items-center justify-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Kurir tidak memerlukan titik peta statis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
