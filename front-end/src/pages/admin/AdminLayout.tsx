import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, apiFetch } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ArrowLeft,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  UserCog,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard Pusat" },
  { to: "/admin/tenants", icon: Store, label: "Kelola Toko (Tenant)" },
  { to: "/admin/users", icon: Users, label: "Data Pengguna" },
  { to: "/admin/reports", icon: BarChart3, label: "Laporan Global" },
];


const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State untuk Notifikasi
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const session = getSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const unreadCount = notifications.filter(n => n.unread).length;


  // Menutup dropdown notif jika klik di luar area
 // Ambil data notifikasi dari API
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiFetch("/notifications");
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (error) {
        console.error("Gagal muat notif", error);
      }
    };
    fetchNotifs();
    
    // Opsional: Refresh notif setiap 30 detik agar real-time
    const interval = setInterval(fetchNotifs, 30000); 
    return () => clearInterval(interval);
  }, []);

  // Fungsi tandai dibaca ke Database
  const markAllAsRead = async () => {
    try {
      await apiFetch("/notifications/mark-read", { method: "PUT" });
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
    } catch (error) {
      console.error("Gagal update status notif", error);
    }
  };

  // Helper untuk mengubah format waktu menjadi "5 menit lalu"
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
    return `${Math.floor(diffInMinutes / 1440)} hari lalu`;
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-2 px-4 py-6">
      <div className="mb-2 px-2 text-xs font-black uppercase tracking-widest text-primary/70 flex items-center gap-2">
        {(sidebarOpen || mobileOpen) && (
           <>
             <Sparkles className="h-3.5 w-3.5" />
             Menu Operasional
           </>
        )}
      </div>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 overflow-hidden shadow-sm",
            isActive(item.to)
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/25 shadow-lg"
              : "bg-background border border-border/50 text-muted-foreground hover:border-primary/30 hover:shadow-md hover:text-foreground",
          )}
        >
          <div className={cn(
            "flex items-center justify-center rounded-lg p-1.5 transition-colors",
            isActive(item.to) ? "bg-white/20" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isActive(item.to) ? "scale-110" : "group-hover:scale-110")} />
          </div>
          {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
          
          {/* Indikator aktif di pinggir */}
          {isActive(item.to) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          )}
        </Link>
      ))}
    </nav>
  );

  // PROTEKSI: HANYA UNTUK SUPER ADMIN
  if (!session || session.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        {/* Background Hiasan Login/Ditolak */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-[2rem] overflow-hidden relative z-10 bg-slate-950/80 backdrop-blur-xl border-slate-800">
          <div className="h-2 bg-gradient-to-r from-red-600 to-rose-500 w-full absolute top-0 left-0"></div>
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-500/5">
              <ShieldAlert className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-white">Akses Ditolak</h2>
            <p className="mb-8 text-slate-400 text-sm px-4">
              Area ini dijaga ketat dan khusus untuk Pemilik Sistem (Super Admin).
            </p>
            <Button asChild className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white">
              <Link to="/login">Kembali ke Portal Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
      {/* Background Pattern Grid (Efek Rame) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-all duration-300 md:flex z-20 shadow-[8px_0_30px_rgba(0,0,0,0.03)] relative",
          sidebarOpen ? "w-72" : "w-24",
        )}
      >
        <div className="flex h-20 shrink-0 items-center justify-center border-b border-border/60 px-4 bg-gradient-to-b from-primary/10 to-transparent">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-black text-lg text-foreground tracking-tight leading-none uppercase">WarungSync</span>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1">Command Center</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <NavContent />
        </div>

        {/* Profil Admin Bottom Sidebar */}
        <div className="border-t border-border/60 p-4 bg-muted/30">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-background border border-border/50 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate text-foreground">{(session as any)?.nama || 'Super Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.email || 'admin@warungsync.com'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center justify-center rounded-xl py-2.5 bg-background border border-border/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
            {sidebarOpen && <span className="ml-2 text-sm font-semibold">Perkecil Menu</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tight leading-none uppercase">WarungSync</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 bg-background border shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavContent />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden z-10 relative">
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b border-border/60 bg-card/70 backdrop-blur-xl px-4 md:px-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <Button variant="outline" size="icon" className="md:hidden rounded-xl shadow-sm bg-background/50" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-col hidden sm:flex">
            <h1 className="text-xl font-black text-foreground tracking-tight">
              {navItems.find((n) => isActive(n.to))?.label || "Pusat Kontrol"}
            </h1>
            <p className="text-xs font-medium text-muted-foreground">Monitoring ekosistem terpadu</p>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            {/* Notification Bell with Functional Dropdown */}
            <div className="relative" ref={notifRef}>
              <Button 
                variant="outline" 
                size="icon" 
                className={cn("rounded-full relative border-border/60 bg-background/50 shadow-sm transition-all", showNotif && "ring-2 ring-primary/20 border-primary/50")}
                onClick={() => setShowNotif(!showNotif)}
              >
                <Bell className={cn("h-5 w-5 transition-colors", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-1 -mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-background text-[8px] font-bold text-white items-center justify-center">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </Button>

              {/* Popover Notifikasi */}
              {showNotif && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
                    <h3 className="font-bold text-sm">Notifikasi Sistem</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                        <Check className="h-3 w-3" /> Tandai dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">Tidak ada notifikasi baru.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={cn(
                          "flex gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                          notif.unread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
                        )}>
                          <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", notif.unread ? "bg-primary" : "bg-transparent")} />
                          <div className="flex-1 space-y-1">
                            <p className={cn("text-sm font-semibold", notif.unread ? "text-foreground" : "text-muted-foreground")}>{notif.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{notif.desc}</p>
                            <p className="text-[10px] font-medium text-muted-foreground/60">{timeAgo(notif.time)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-border/60 hidden sm:block"></div>
            
            <Button variant="destructive" size="sm" className="gap-2 rounded-xl h-10 shadow-lg shadow-destructive/20 font-bold" onClick={handleLogout}>
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Aksen Glow Kiri Atas Area Konten */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
          
          <div className="mx-auto w-full max-w-7xl relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;