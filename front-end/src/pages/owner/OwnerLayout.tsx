import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, apiFetch } from "@/lib/store";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Monitor,
  ClipboardList,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ArrowLeft,
  Bell,
  UserCircle,
  ShieldAlert,
  Check,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const navItems = [
  { to: "/owner", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/owner/pos", icon: Monitor, label: "Kasir (POS)" },
  { to: "/owner/products", icon: Package, label: "Produk" },
  { to: "/owner/inventory", icon: Warehouse, label: "Inventori" },
  { to: "/owner/orders", icon: ClipboardList, label: "Pesanan" },
  { to: "/owner/reports", icon: BarChart3, label: "Laporan" },
  { to: "/owner/settings", icon: Settings, label: "Pengaturan" },
];

const OwnerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = getSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // NOTIFIKASI KURIR STATE
  const [pendingCouriers, setPendingCouriers] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (session?.role === "owner") {
      fetchPendingCouriers();
    }
  }, [session?.role]);

  const fetchPendingCouriers = async () => {
    try {
      const res = await apiFetch("/users/pending-couriers");
      setPendingCouriers(res.data || []);
    } catch (error) {
      console.error("Gagal mengambil notifikasi kurir", error);
    }
  };

  const handleCourierAction = async (
    id: number,
    action: "approve" | "reject",
  ) => {
    try {
      setIsProcessing(true);
      await apiFetch(`/users/courier/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      toast.success(
        action === "approve" ? "Kurir disetujui!" : "Pendaftaran kurir ditolak",
      );
      fetchPendingCouriers();
    } catch (error) {
      toast.error("Gagal memproses aksi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/owner"
      ? location.pathname === "/owner"
      : location.pathname.startsWith(path);

  const NavContent = () => (
    <nav className="flex flex-col gap-1.5 px-3 py-4">
      <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
        {(sidebarOpen || mobileOpen) && "Menu Utama"}
      </div>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
            isActive(item.to)
              ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
              : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
          )}
        >
          {isActive(item.to) && (
            <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              isActive(item.to) ? "scale-110" : "group-hover:scale-110",
            )}
          />
          {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
        </Link>
      ))}
    </nav>
  );

  if (!session || session.role !== "owner") {
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
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak
              memiliki izin.
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

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/5">
      <aside
        className={cn(
          "hidden flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 md:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border/50 px-4">
          <WarungSyncLogo
            size="sm"
            showWordmark={sidebarOpen}
            className={cn(
              "[&_span]:text-foreground [&_span:last-child]:text-foreground/60 transition-all",
              !sidebarOpen && "justify-center w-full scale-90",
            )}
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <NavContent />
        </div>
        <div className="border-t border-border/50 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-primary/10 p-2 transition-all",
              !sidebarOpen && "justify-center",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold text-foreground">
                  {session.name || "Pemilik Toko"}
                </span>
                <span className="truncate text-xs text-muted-foreground uppercase">
                  {session.role}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mt-2 flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                !sidebarOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
              <WarungSyncLogo size="sm" />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-1.5 hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavContent />
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/50 bg-card/80 backdrop-blur-md px-4 md:px-8 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {navItems.find((n) => isActive(n.to))?.label || "Dashboard"}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* FITUR TOMBOL NOTIFIKASI KURIR */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={() => setIsNotifOpen(true)}
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {pendingCouriers.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white border border-card shadow-sm">
                  {pendingCouriers.length}
                </span>
              )}
            </Button>

            <div className="h-6 w-px bg-border/80 hidden sm:block"></div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex rounded-full px-4"
              asChild
            >
              <Link to="/customer/stores">Lihat Toko</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <ArrowLeft className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* POP-UP NOTIFIKASI */}
      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifikasi Toko
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Permintaan Kurir ({pendingCouriers.length})
            </h4>
            {pendingCouriers.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8 border border-dashed rounded-xl">
                Belum ada notifikasi baru.
              </p>
            ) : (
              pendingCouriers.map((kurir) => (
                <div
                  key={kurir.id}
                  className="border border-border/60 rounded-xl p-4 bg-muted/20 flex flex-col gap-3"
                >
                  <div>
                    <p className="font-bold text-foreground">{kurir.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      NIK: {kurir.nik} • {kurir.kontak}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1 bg-primary/10 w-fit px-2 py-0.5 rounded">
                      {kurir.tipe_kendaraan} ({kurir.plat_nomor})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      disabled={isProcessing}
                      onClick={() => handleCourierAction(kurir.id, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Tolak
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      disabled={isProcessing}
                      onClick={() => handleCourierAction(kurir.id, "approve")}
                    >
                      <Check className="h-4 w-4" /> Terima Kurir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerLayout;
