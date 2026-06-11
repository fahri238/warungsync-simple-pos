import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/pos", icon: Monitor, label: "Kasir (POS)" },
  { to: "/admin/products", icon: Package, label: "Produk" },
  { to: "/admin/inventory", icon: Warehouse, label: "Inventori" },
  { to: "/admin/orders", icon: ClipboardList, label: "Pesanan" },
  { to: "/admin/reports", icon: BarChart3, label: "Laporan" },
  { to: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
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
          {/* side line indicator active */}
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

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/5">
      {/* Desktop Sidebar (Desain Floating & Glass) */}
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

        {/* User Profile Snippet */}
        <div className="border-t border-border/50 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-secondary/20 p-2 transition-all",
              !sidebarOpen && "justify-center",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold text-foreground">
                  Admin Toko
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Owner
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

      {/* Mobile Sidebar Overlay */}
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header Modern (Sticky with Blur) */}
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
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border border-card"></span>
            </Button>
            <div className="h-6 w-px bg-border/80 hidden sm:block"></div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex rounded-full px-4"
              asChild
            >
              <Link to="/stores">Lihat Toko</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive"
              asChild
            >
              <Link to="/login">
                <ArrowLeft className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">Keluar</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Area  */}
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
