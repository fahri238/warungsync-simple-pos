import { useState } from "react";
import { Link } from "react-router-dom";
import { getDeliverySettings, saveDeliverySettings, getSession } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Settings, Truck } from "lucide-react";
import { toast } from "sonner";

const OwnerSettings = () => {
  const session = getSession();
  
  // Catatan: Jika suatu saat pengaturan toko ini dipindahkan ke database backend,
  // kita tinggal mengubah fungsi getDeliverySettings ini menjadi pemanggilan API (apiFetch).
  const [delivery, setDelivery] = useState(getDeliverySettings);

  const toggleDelivery = (enabled: boolean) => {
    const updated = { enabled };
    saveDeliverySettings(updated);
    setDelivery(updated);
    toast.success(enabled ? "Fitur pengiriman diaktifkan" : "Fitur pengiriman dinonaktifkan");
  };

  // PENGECEKAN KEAMANAN UNTUK OWNER
  if (!session || session.role !== "owner") {
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
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak memiliki izin untuk mengakses halaman ini.
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
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Pengaturan Toko
        </h2>
        <p className="text-sm text-muted-foreground">
          Kelola preferensi dan fitur operasional warung Anda di sini.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Preferensi Pengiriman
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-foreground">Aktifkan Kurir / Delivery</Label>
              <p className="text-sm text-muted-foreground">
                Jika fitur ini dimatikan, pelanggan hanya bisa memesan dengan metode ambil sendiri (pickup) ke toko Anda.
              </p>
            </div>
            <Switch 
              checked={delivery.enabled} 
              onCheckedChange={toggleDelivery} 
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerSettings;