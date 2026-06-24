import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminPOS from "./pages/admin/AdminPOS";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

// Rute Toko / Belanja
import StoreSelectPage from "./pages/customer/CustomerSelectPage";
import StoreRedirect from "./pages/customer/CustomerRedirect";
import StorePage from "./pages/customer/CustomerPage";
import StoreCart from "./pages/customer/CustomerCart";
import StoreCheckout from "./pages/customer/CustomerCheckout";
import StoreOrders from "./pages/customer/CustomerOrders";

// Rute Pelanggan
import CustomerLayout from "./pages/customer/CustomerLayout"; // <-- Layout baru diimpor
import CustomerDashboard from "./pages/customer/CustomerDashboard";

import CourierDashboard from "./pages/courier/CourierDashboard";
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

              {/* === RUTE ADMIN (Dilindungi AdminLayout) === */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="pos" element={<AdminPOS />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* === RUTE CUSTOMER (Dilindungi CustomerLayout) === */}
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