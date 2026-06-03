import { useState } from "react";
import { getDeliverySettings, saveDeliverySettings } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminSettings = () => {
  const [delivery, setDelivery] = useState(getDeliverySettings);

  const toggleDelivery = (enabled: boolean) => {
    const updated = { enabled };
    saveDeliverySettings(updated);
    setDelivery(updated);
    toast.success(enabled ? "Pengiriman diaktifkan" : "Pengiriman dinonaktifkan");
  };

  return (
    <div className="max-w-lg space-y-6 animate-slide-in">
      <Card>
        <CardHeader><CardTitle className="text-base">Pengaturan Pengiriman</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Aktifkan Kurir / Delivery</Label>
              <p className="text-sm text-muted-foreground">Jika dimatikan, pelanggan hanya bisa ambil sendiri (pickup).</p>
            </div>
            <Switch checked={delivery.enabled} onCheckedChange={toggleDelivery} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
