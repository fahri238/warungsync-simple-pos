import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";

// === KOMPONEN SUPER ADMIN (Pemilik Sistem) ===
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStoresPage from "./pages/admin/AdminStoresPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";

// === KOMPONEN OWNER (Pemilik Warung) ===
import OwnerLayout from "./pages/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerProducts from "./pages/owner/OwnerProducts";
import OwnerInventory from "./pages/owner/OwnerInventory";
import OwnerPOS from "./pages/owner/OwnerPOS";
import OwnerOrders from "./pages/owner/OwnerOrders";
import OwnerReports from "./pages/owner/OwnerReports";
import OwnerSettings from "./pages/owner/OwnerSettings";

// === KOMPONEN CUSTOMER (Pelanggan) ===
import StoreSelectPage from "./pages/customer/CustomerSelectPage";
import StoreRedirect from "./pages/customer/CustomerRedirect";
import StorePage from "./pages/customer/CustomerPage";
import StoreCart from "./pages/customer/CustomerCart";
import StoreCheckout from "./pages/customer/CustomerCheckout";
import StoreOrders from "./pages/customer/CustomerOrders";
import CustomerLayout from "./pages/customer/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

// === KOMPONEN COURIER (Kurir) ===
import CourierDashboard from "./pages/courier/CourierDashboard";

// === AUTH & LAINNYA ===
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import LocationPickerPage from "./pages/auth/LocationPickerPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/StoreContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StoreProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/location" element={<LocationPickerPage />} />

              {/* === RUTE SUPER ADMIN (Pemilik Sistem) === */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                {/* Nanti kita buat halamannya satu per satu */}
                <Route path="tenants" element={<AdminStoresPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="reports" element={< AdminReportsPage/>} />
              </Route>

              {/* === RUTE OWNER (Pemilik Warung) === */}
              <Route path="/owner" element={<OwnerLayout />}>
                <Route index element={<OwnerDashboard />} />
                <Route path="products" element={<OwnerProducts />} />
                <Route path="inventory" element={<OwnerInventory />} />
                <Route path="pos" element={<OwnerPOS />} />
                <Route path="orders" element={<OwnerOrders />} />
                <Route path="reports" element={<OwnerReports />} />
                <Route path="settings" element={<OwnerSettings />} />
              </Route>

              {/* === RUTE CUSTOMER (Pelanggan) === */}
              <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<CustomerDashboard />} />
                <Route path="stores" element={<StoreSelectPage />} />
                <Route path="store" element={<StoreRedirect />} />
                <Route path="store/:storeId" element={<StorePage />} />
                <Route path="store/:storeId/cart" element={<StoreCart />} />
                <Route path="store/:storeId/checkout" element={<StoreCheckout />} />
                <Route path="store/:storeId/orders" element={<StoreOrders />} />
              </Route>

              {/* === RUTE COURIER === */}
              <Route path="/courier" element={<CourierDashboard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StoreProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;