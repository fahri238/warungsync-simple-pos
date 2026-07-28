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
  ShieldAlert,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  
  // STATE BARU: Untuk menampilkan Pop-Up KYC di tengah layar
  const [kycModal, setKycModal] = useState({ isOpen: false, status: "pending", message: "" });

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
      
      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "owner") {
        navigate("/owner");
      } else if (userData.role === "kurir" || userData.role === "courier") {
        navigate("/courier");
      } else if (userData.role === "pelanggan" || userData.role === "customer") {
        navigate("/customer");
      } else {
        toast.error("Peran pengguna tidak dikenal oleh sistem.");
      }

    } catch (error: unknown) {
      // Menangkap pesan error dari backend
      const msg = error instanceof Error ? error.message : "Email atau password salah";

      // LOGIKA BARU: Filter jenis error untuk ditampilkan di Pop-Up
      if (msg.includes("1x24 Jam") || msg.toLowerCase().includes("diproses")) {
        // Jika error mengandung kata "1x24 Jam", berarti status Pending
        setKycModal({ isOpen: true, status: "pending", message: "Verifikasi akan dilakukan 1x24 jam." });
      } else if (
        msg === "Email atau kata sandi salah" || 
        msg === "Email dan kata sandi wajib diisi" || 
        msg.includes("dinonaktifkan") ||
        msg.includes("Network") ||
        msg.includes("fetch")
      ) {
        // Jika error sistem biasa, tampilkan toast kecil
        toast.error(msg);
      } else {
        // Sisa error lainnya diasumsikan sebagai "Alasan Penolakan" dari Admin
        setKycModal({ isOpen: true, status: "rejected", message: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-1">
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

      {/* POP-UP MODAL STATUS KYC (DITOLAK ATAU PENDING) */}
      <Dialog open={kycModal.isOpen} onOpenChange={(open) => setKycModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-sm text-center p-8 border-0 shadow-2xl">
          <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full mb-4 ${kycModal.status === 'rejected' ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
            {kycModal.status === 'rejected' ? (
              <ShieldAlert className="h-12 w-12 text-destructive" />
            ) : (
              <Clock className="h-12 w-12 text-green-500" />
            )}
          </div>
          <DialogTitle className={`text-2xl font-bold mb-2 ${kycModal.status === 'rejected' ? 'text-destructive' : 'text-green-600'}`}>
            {kycModal.status === 'rejected' ? 'Verifikasi Ditolak' : 'Sedang Diverifikasi'}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground font-medium mb-6">
            {kycModal.message}
          </DialogDescription>
          <Button
            className="w-full h-12 text-base font-bold shadow-md"
            variant={kycModal.status === 'rejected' ? 'destructive' : 'default'}
            onClick={() => setKycModal(prev => ({ ...prev, isOpen: false }))}
          >
            Mengerti
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;