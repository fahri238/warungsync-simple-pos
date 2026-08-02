import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDeliverySettings,
  saveDeliverySettings,
  getSession,
  apiFetch,
} from "@/lib/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ShieldAlert,
  Settings,
  Truck,
  Landmark,
  Users,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  UserSquare2,
  Edit,
  Eye,
  IdCard,
  Phone,
  CarFront,
} from "lucide-react";
import { toast } from "@/lib/custom-toast";

const OwnerSettings = () => {
  const session = getSession();
  const storeId = session?.store_id;

  const [delivery, setDelivery] = useState(getDeliverySettings());
  const [rates, setRates] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newVillage, setNewVillage] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccName, setNewAccName] = useState("");

  // Dialog States untuk Kurir
  const [detailCourier, setDetailCourier] = useState<any | null>(null);
  const [editCourier, setEditCourier] = useState<any | null>(null);
  const [isUpdatingCourier, setIsUpdatingCourier] = useState(false);

  const loadData = async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const [resRates, resBanks, resCouriers] = await Promise.all([
        apiFetch(`/stores/${storeId}/shipping-rates`).catch(() => ({
          data: [],
        })),
        apiFetch(`/stores/${storeId}/banks`).catch(() => ({ data: [] })),
        // PERBAIKAN: Mengambil kurir yang aktif saja beserta data KTP dan kendaraannya
        apiFetch(`/users/active-couriers`).catch(() => ({ data: [] })),
      ]);
      setRates(resRates.data || []);
      setBanks(resBanks.data || []);
      setCouriers(resCouriers.data || []);
    } catch (error) {
      toast.error("Gagal memuat data pengaturan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.role === "owner") loadData();
  }, [session?.role, storeId]);

  const toggleDelivery = (enabled: boolean) => {
    saveDeliverySettings({ enabled });
    setDelivery({ enabled });
    toast.success(
      enabled ? "Fitur kurir diaktifkan" : "Fitur kurir dinonaktifkan",
    );
  };

  const handleAddRate = async () => {
    if (!newVillage || !newRate)
      return toast.error("Lengkapi nama desa dan tarif");
    try {
      await apiFetch(`/stores/${storeId}/shipping-rates`, {
        method: "POST",
        body: JSON.stringify({
          villageName: newVillage,
          rate: Number(newRate),
        }),
      });
      toast.success("Wilayah pengiriman ditambahkan");
      setNewVillage("");
      setNewRate("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteRate = async (id: number) => {
    try {
      await apiFetch(`/stores/shipping-rates/${id}`, { method: "DELETE" });
      toast.success("Wilayah dihapus");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddBank = async () => {
    if (!newBankName || !newAccNumber || !newAccName)
      return toast.error("Lengkapi semua data rekening");
    try {
      await apiFetch(`/stores/${storeId}/banks`, {
        method: "POST",
        body: JSON.stringify({
          bank_name: newBankName,
          account_number: newAccNumber,
          account_name: newAccName,
        }),
      });
      toast.success("Rekening bank ditambahkan");
      setNewBankName("");
      setNewAccNumber("");
      setNewAccName("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteBank = async (id: number) => {
    try {
      await apiFetch(`/stores/banks/${id}`, { method: "DELETE" });
      toast.success("Rekening dihapus");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // --- HANDLER TIM KURIR ---
  const handleUpdateCourierInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourier) return;
    try {
      setIsUpdatingCourier(true);
      await apiFetch(`/users/courier/${editCourier.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nama: editCourier.nama,
          kontak: editCourier.kontak,
          tipe_kendaraan: editCourier.tipe_kendaraan,
          plat_nomor: editCourier.plat_nomor,
        }),
      });
      toast.success("Data kurir berhasil diperbarui!");
      setEditCourier(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui kurir");
    } finally {
      setIsUpdatingCourier(false);
    }
  };

  const handleDeleteCourier = async (id: number) => {
    try {
      await apiFetch(`/users/courier/${id}`, { method: "DELETE" });
      toast.success("Kurir diberhentikan secara permanen.");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal memberhentikan kurir");
    }
  };

  if (!session || session.role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-12">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2">Akses Ditolak</h2>
            <Button asChild className="w-full mt-4">
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Pengaturan Toko
        </h2>
        <p className="text-sm text-muted-foreground">
          Kelola rute pengiriman, rekening pembayaran, dan tim kurir.
        </p>
      </div>

      <Tabs defaultValue="delivery" className="w-full">
        <TabsList className="bg-muted p-1 grid grid-cols-3 max-w-2xl mb-6">
          <TabsTrigger value="delivery" className="gap-2">
            <Truck className="h-4 w-4" /> Pengiriman
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Landmark className="h-4 w-4" /> Rekening Bank
          </TabsTrigger>
          <TabsTrigger value="courier" className="gap-2">
            <Users className="h-4 w-4" /> Tim Kurir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Status Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Aktifkan Kurir Internal
                </Label>
                <p className="text-sm text-muted-foreground">
                  Jika mati, pelanggan hanya bisa Pickup.
                </p>
              </div>
              <Switch
                checked={delivery.enabled}
                onCheckedChange={toggleDelivery}
                className="data-[state=checked]:bg-primary"
              />
            </CardContent>
          </Card>

          {delivery.enabled && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Area & Tarif
                  Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 items-end bg-muted/30 p-4 rounded-xl border border-dashed">
                  <div className="space-y-2 w-full">
                    <Label>Nama Area / Desa</Label>
                    <Input
                      value={newVillage}
                      onChange={(e) => setNewVillage(e.target.value)}
                      placeholder="Contoh: Montallat Utara"
                    />
                  </div>
                  <div className="space-y-2 w-full">
                    <Label>Tarif (Rp)</Label>
                    <Input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                  <Button
                    onClick={handleAddRate}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rates.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-lg border shadow-sm bg-card"
                    >
                      <div>
                        <p className="font-semibold text-sm">{r.villageName}</p>
                        <p className="text-primary font-bold text-xs">
                          Rp {r.rate.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Wilayah?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRate(r.id)}
                              className="bg-destructive"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bank" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" /> Rekening
                Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col lg:flex-row gap-3 items-end bg-muted/30 p-4 rounded-xl border border-dashed">
                <div className="space-y-2 w-full">
                  <Label>Nama Bank</Label>
                  <Input
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="BCA / DANA"
                  />
                </div>
                <div className="space-y-2 w-full">
                  <Label>No. Rekening</Label>
                  <Input
                    type="number"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2 w-full">
                  <Label>Atas Nama (a.n)</Label>
                  <Input
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddBank}
                  className="w-full lg:w-auto gap-2"
                >
                  <Plus className="h-4 w-4" /> Tambah
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {banks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-4 rounded-xl border shadow-sm bg-gradient-to-br from-card to-muted/20"
                  >
                    <div>
                      <p className="font-bold">
                        {b.bank_name} •{" "}
                        <span className="font-mono">{b.account_number}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        a.n. {b.account_name}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Rekening?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteBank(b.id)}
                            className="bg-destructive"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courier" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <UserSquare2 className="h-5 w-5 text-primary" /> Tim Kurir Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {couriers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada kurir aktif.
                  </p>
                ) : (
                  couriers.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border shadow-sm bg-card"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            {c.nama}{" "}
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Aktif
                            </span>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.kontak || "No HP Kosong"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditCourier({ ...c })}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-destructive border-destructive/20 gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Pecat Kurir?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ini akan menghapus akun kurir{" "}
                                <strong>{c.nama}</strong> dari toko Anda secara
                                permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourier(c.id)}
                                className="bg-destructive"
                              >
                                Ya, Berhentikan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          size="sm"
                          onClick={() => setDetailCourier(c)}
                          className="h-8 text-xs bg-primary gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL EDIT KURIR */}
      <Dialog
        open={!!editCourier}
        onOpenChange={(open) => !open && setEditCourier(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Kurir</DialogTitle>
          </DialogHeader>
          {editCourier && (
            <form onSubmit={handleUpdateCourierInfo} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={editCourier.nama}
                  onChange={(e) =>
                    setEditCourier({ ...editCourier, nama: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor HP / WA</Label>
                <Input
                  value={editCourier.kontak}
                  onChange={(e) =>
                    setEditCourier({ ...editCourier, kontak: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipe Kendaraan</Label>
                  <Input
                    value={editCourier.tipe_kendaraan}
                    onChange={(e) =>
                      setEditCourier({
                        ...editCourier,
                        tipe_kendaraan: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plat Nomor</Label>
                  <Input
                    value={editCourier.plat_nomor}
                    onChange={(e) =>
                      setEditCourier({
                        ...editCourier,
                        plat_nomor: e.target.value.toUpperCase(),
                      })
                    }
                    className="uppercase"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditCourier(null)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isUpdatingCourier}>
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DETAIL KTP KURIR */}
      <Dialog
        open={!!detailCourier}
        onOpenChange={(open) => !open && setDetailCourier(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-primary" /> Detail Informasi Kurir
            </DialogTitle>
          </DialogHeader>
          {detailCourier && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Nama Lengkap
                  </p>
                  <p className="text-sm font-medium">{detailCourier.nama}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Kontak
                  </p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />{" "}
                    {detailCourier.kontak || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Kendaraan
                  </p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <CarFront className="h-3.5 w-3.5" />{" "}
                    {detailCourier.tipe_kendaraan || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Plat Nomor
                  </p>
                  <p className="text-sm font-mono font-bold bg-muted px-2 py-0.5 rounded w-fit uppercase">
                    {detailCourier.plat_nomor || "-"}
                  </p>
                </div>
              </div>
              <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted/50 p-3 border-b flex justify-between items-center">
                  <p className="text-sm font-bold flex gap-2">
                    <IdCard className="h-4 w-4 text-primary" /> Foto KTP
                  </p>
                  <p className="text-xs font-mono">
                    NIK: {detailCourier.nik || "-"}
                  </p>
                </div>
                <div className="bg-black/5 p-4 flex justify-center min-h-[200px]">
                  {detailCourier.foto_ktp ? (
                    <img
                      src={`http://localhost:5000/uploads/ktp/${detailCourier.foto_ktp}`}
                      alt="KTP Kurir"
                      className="max-h-[300px] object-contain rounded-lg"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src =
                          "https://placehold.co/600x400/eee/999?text=KTP+Gagal+Dimuat")
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground self-center">
                      Foto KTP tidak tersedia
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerSettings;
