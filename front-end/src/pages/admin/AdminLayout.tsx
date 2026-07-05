import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { getSession } from "@/lib/store";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
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

  const NavContent = () => (
    <nav className="flex flex-col gap-1.5 px-3 py-4">
      <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
        {(sidebarOpen || mobileOpen) && "Menu Super Admin"}
      </div>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
            isActive(item.to)
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
          )}
        >
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

  // PROTEKSI: HANYA UNTUK SUPER ADMIN
  if (!session || session.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-[2rem] overflow-hidden relative">
          <div className="h-2 bg-destructive w-full absolute top-0 left-0"></div>
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/5">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-foreground">Akses Ditolak</h2>
            <p className="mb-8 text-muted-foreground text-sm px-4">
              Area ini khusus untuk Pemilik Sistem (Super Admin).
            </p>
            <Button asChild className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20">
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-border/50 bg-card transition-all duration-300 md:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border/50 px-4 bg-primary/5">
          <ShieldCheck className="h-6 w-6 text-primary mr-2 shrink-0" />
          {sidebarOpen && <span className="font-bold text-foreground truncate">Super Admin</span>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <NavContent />
        </div>

        <div className="border-t border-border/50 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-bold">Super Admin</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-1.5 hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavContent />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/50 bg-card/80 backdrop-blur-md px-4 md:px-8 shadow-sm">
          <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-bold text-foreground leading-tight">
            {navItems.find((n) => isActive(n.to))?.label || "Pusat Kontrol"}
          </h1>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="h-6 w-px bg-border/80 hidden sm:block"></div>
            <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Keluar Sistem</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;