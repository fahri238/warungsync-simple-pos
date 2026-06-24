import { Outlet, Link, Navigate } from "react-router-dom";
import { getSession } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const CustomerLayout = () => {
  const session = getSession();

  // Satpam Pengecekan Keamanan Role Pelanggan
  if (!session || session.role !== "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4">
        <Card className="w-full max-w-sm text-center shadow-lg border-0 rounded-3xl">
          <CardContent className="py-10">
            <div className="mx-auto h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-inner mb-6">
              <ShieldAlert className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="mb-6 text-muted-foreground text-sm">
              Halaman ini khusus untuk Pelanggan. Sesi Anda tidak valid atau Anda menggunakan akun Admin/Kurir.
            </p>
            <Button asChild className="w-full rounded-xl h-12 text-base">
              <Link to="/login">Masuk Sebagai Pelanggan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Jika aman (role === customer), render komponen di dalamnya
  return (
    <div className="customer-wrapper">
      <Outlet />
    </div>
  );
};

export default CustomerLayout;