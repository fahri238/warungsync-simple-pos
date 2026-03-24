import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Package, Warehouse, Monitor, ClipboardList,
  BarChart3, Settings, Menu, X, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const NavContent = () => (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.to)
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r bg-sidebar transition-all duration-200 md:flex",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <span className="text-xl">🏪</span>
          {sidebarOpen && <span className="font-bold text-sidebar-foreground">WarungSync</span>}
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavContent />
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center border-t border-sidebar-border py-3 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <span className="font-bold text-sidebar-foreground">WarungSync</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {navItems.find((n) => isActive(n.to))?.label || "Admin"}
          </h1>
          <div className="ml-auto">
            <Button variant="outline" size="sm" asChild>
              <Link to="/store">Lihat Toko</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
