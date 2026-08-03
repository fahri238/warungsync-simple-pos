import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, apiFetch } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  FileBadge,
  LogOut,
  Menu,
  X,
  Truck,
  UserCircle,
  Loader2,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CourierLayout = () => {
  const session = getSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isApproved, setIsApproved] = useState((session as any)?.is_approved === 1);
  const [isChecking, setIsChecking] = useState(true);
  const [storeName, setStoreName] = useState("");

  const navItems = [
    { to: "/courier", icon: LayoutDashboard, label: "Dashboard", requiresApproval: true },
    { to: "/courier/history", icon: ClipboardList, label: "Riwayat", requiresApproval: true },
    { to: "/courier/status", icon: FileBadge, label: "Status Pengajuan", requiresApproval: false },
  ];

  useEffect(() => {
    const verifyStatus = async () => {
      try {
        const res = await apiFetch("/users/me");
        if (res.data) {
          setIsApproved(res.data.is_approved === 1);
          
          if (res.data.store_id) {
            const storeRes = await apiFetch("/stores/list");
            const matchedStore = storeRes.data?.find((s: any) => Number(s.id) === Number(res.data.store_id));
            if (matchedStore) {
              setStoreName(matchedStore.name || matchedStore.nama);
            } else {
              setStoreName(`Toko ${res.data.store_id}`);
            }
          }

          const localUser = localStorage.getItem("user");
          if (localUser) {
            const parsed = JSON.parse(localUser);
            parsed.is_approved = res.data.is_approved;
            parsed.status = res.data.status;
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        }
      } catch (error) {
        console.error("Gagal sinkronisasi status kurir", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyStatus();
  }, []);

  useEffect(() => {
    if (!isChecking && !isApproved && location.pathname !== "/courier/status") {
      navigate("/courier/status", { replace: true });
    }
  }, [isApproved, isChecking, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/courier") return location.pathname === "/courier";
    return location.pathname.startsWith(path);
  };

  if (isChecking && !isApproved && location.pathname !== "/courier/status") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Mensinkronkan sesi...</p>
      </div>
    );
  }

  if (!isChecking && !isApproved && location.pathname !== "/courier/status") return null;

  return (
    <div className="flex h-screen bg-secondary/5 overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-[260px] bg-card border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="flex h-20 shrink-0 items-center border-b border-border/50 px-6 gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Truck className="h-6 w-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Kurir<span className="text-primary">Sync</span>
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <p className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Menu Utama</p>
          {navItems.map((item) => {
            const locked = item.requiresApproval && !isApproved;
            return (
              <Link
                key={item.to}
                to={locked ? "#" : item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 overflow-hidden",
                  isActive(item.to) ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                  locked && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                )}
              >
                {isActive(item.to) && <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform", isActive(item.to) ? "scale-110" : "group-hover:scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-3 rounded-xl bg-background border border-border/50 p-3 mb-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="flex flex-col overflow-hidden w-full">
              <span className="truncate text-sm font-bold text-foreground">{session?.name || "Kurir"}</span>
              <span className="truncate text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Store className="h-3 w-3 shrink-0" /> <span className="truncate">{storeName || "Belum terikat"}</span>
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full text-destructive hover:bg-destructive hover:text-white border-destructive/20 transition-colors gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border/50 z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2 text-primary font-black text-lg">
          <Truck className="h-5 w-5" /> KurirSync
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      <main className="flex-1 relative overflow-y-auto pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="hidden md:flex h-20 items-center border-b border-border/50 px-8 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-foreground">
            {navItems.find((n) => isActive(n.to))?.label || "Dasbor"}
          </h1>
        </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 z-30 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const locked = item.requiresApproval && !isApproved;
          return (
            <Link
              key={item.to}
              to={locked ? "#" : item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full",
                isActive(item.to) ? "text-primary" : "text-muted-foreground hover:text-foreground",
                locked && "opacity-40 grayscale pointer-events-none"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive(item.to) && "scale-110 mb-0.5")} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95">
          <Button variant="ghost" className="absolute top-4 right-4" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-8 w-8" />
          </Button>
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-black mb-2 shadow-inner">
              {session?.name?.charAt(0) || "K"}
            </div>
            <h2 className="text-2xl font-bold">{session?.name}</h2>
            <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md flex items-center gap-2 mt-1">
              <Store className="h-4 w-4" /> {storeName || "Belum Terikat"}
            </p>
          </div>
          <Button variant="destructive" className="w-[200px] h-14 rounded-full font-bold text-base shadow-lg" onClick={handleLogout}>
            Keluar Akun
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourierLayout;