import { useState, useEffect, useMemo } from "react";
import { 
  Store, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Eye,
  MapPin,
  Phone,
  Activity,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/store";
import { toast } from "sonner";

// Tipe data Toko
interface StoreData {
  id: number;
  nama: string;
  alamat: string;
  kontak: string;
  latitude: number;
  longitude: number;
  status: "aktif" | "nonaktif"; // Akan kita tambahkan ke database nanti
}

const AdminStoresPage = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State untuk Modal Form (Tambah/Edit) dan Detail
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    kontak: "",
    latitude: "",
    longitude: ""
  });

  // Ambil Data dari API
  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/stores");
      if (res.success && res.data) {
        setStores(res.data);
      }
    } catch (error) {
      console.warn("API Kelola Toko belum siap, menggunakan data kosong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Filter pencarian
  const filteredStores = stores.filter((store) =>
    store.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (store.kontak && store.kontak.includes(searchQuery))
  );

  // Kalkulasi Statistik Mini
  const stats = useMemo(() => {
    return {
      total: stores.length,
      aktif: stores.filter(s => s.status !== "nonaktif").length,
      nonaktif: stores.filter(s => s.status === "nonaktif").length
    };
  }, [stores]);

  // Handler Buka Form
  const openForm = (store: StoreData | null = null) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        nama: store.nama,
        alamat: store.alamat || "",
        kontak: store.kontak || "",
        latitude: store.latitude ? store.latitude.toString() : "",
        longitude: store.longitude ? store.longitude.toString() : ""
      });
    } else {
      setEditingStore(null);
      setFormData({ nama: "", alamat: "", kontak: "", latitude: "", longitude: "" });
    }
    setIsModalOpen(true);
  };

  const openDetail = (store: StoreData) => {
    setEditingStore(store);
    setIsDetailOpen(true);
  };

  // Handler Submit Form (Visual saja untuk saat ini sampai Backend dibuat)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStore) {
        const res = await apiFetch(`/admin/stores/${editingStore.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        if (res.success) toast.success(res.message);
      } else {
        const res = await apiFetch("/admin/stores", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        if (res.success) toast.success(res.message);
      }
      setIsModalOpen(false);
      fetchStores(); // Refresh tabel
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data toko");
    }
  };

  // Handler Hapus
  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus toko ini secara permanen? Data yang sudah dihapus tidak dapat dikembalikan.")) {
      try {
        const res = await apiFetch(`/admin/stores/${id}`, { method: "DELETE" });
        if (res.success) {
          toast.success(res.message);
          fetchStores(); // Refresh tabel
        }
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus toko");
      }
    }
  };

  // Handler Aktif/Nonaktif
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "nonaktif" ? "aktif" : "nonaktif";
    const labelStatus = newStatus === "aktif" ? "mengaktifkan" : "menonaktifkan";
    
    if (confirm(`Apakah Anda yakin ingin ${labelStatus} toko ini?`)) {
      try {
        const res = await apiFetch(`/admin/stores/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.success) {
          toast.success(res.message);
          fetchStores(); // Refresh tabel
        }
      } catch (error: any) {
        toast.error(error.message || "Gagal mengubah status toko");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Banner Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl bg-primary/5 p-6 border border-primary/10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Store className="h-7 w-7 text-primary" />
            Manajemen Mitra Toko
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Kelola daftar tenant, status operasional, dan lokasi warung di ekosistem Anda.
          </p>
        </div>
        <Button onClick={() => openForm()} className="relative z-10 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Tambah Toko
        </Button>
      </div>

      {/* Mini Stats (Desain Rame) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tenant</p>
              <h3 className="text-2xl font-black">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-green-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toko Aktif</p>
              <h3 className="text-2xl font-black text-green-600">{stats.aktif}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <PowerOff className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toko Nonaktif</p>
              <h3 className="text-2xl font-black text-destructive">{stats.nonaktif}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Data */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 border-b border-border/50">
          <CardTitle className="text-lg font-bold">Daftar Toko</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/80">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama Toko</th>
                  <th className="px-6 py-4 font-medium">Kontak</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="h-32 text-center text-muted-foreground">
                      <Activity className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                      Memuat data tenant...
                    </td>
                  </tr>
                ) : filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                        <p>Tidak ada data toko ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {store.nama}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {store.alamat || "Alamat belum diatur"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5 mt-2">
                        <Phone className="h-3.5 w-3.5" /> {store.kontak || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          store.status === "nonaktif" 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-green-500/10 text-green-600"
                        }`}>
                          {store.status === "nonaktif" ? "Nonaktif" : "Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openDetail(store)} title="Detail">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => openForm(store)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className={`h-8 w-8 ${store.status === 'nonaktif' ? 'text-green-500 hover:bg-green-50' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => handleToggleStatus(store.id, store.status || "aktif")} title="Toggle Status">
                            {store.status === "nonaktif" ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(store.id)} title="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form Tambah/Edit (Sederhana tanpa library eksternal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl border-primary/20">
            <CardHeader className="border-b border-border/50">
              <CardTitle>{editingStore ? "Edit Data Toko" : "Tambah Toko Baru"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Toko</label>
                  <Input required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} placeholder="Contoh: Warung Berkah" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kontak (No HP)</label>
                  <Input required value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} placeholder="081234567890" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alamat Lengkap</label>
                  <Input required value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} placeholder="Jl. Raya No. 123..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitude</label>
                    <Input type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} placeholder="-2.12345" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitude</label>
                    <Input type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} placeholder="115.12345" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan Data</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detail Toko */}
      {isDetailOpen && editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-primary/20 overflow-hidden">
            <div className="h-24 bg-primary/10 flex items-center justify-center relative">
               <Store className="h-12 w-12 text-primary opacity-50" />
               <span className={`absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-bold ${editingStore.status === 'nonaktif' ? 'bg-destructive text-destructive-foreground' : 'bg-green-500 text-white'}`}>
                 {editingStore.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
               </span>
            </div>
            <CardContent className="pt-6 text-center space-y-4">
              <div>
                <h3 className="text-xl font-bold">{editingStore.nama}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Phone className="h-3 w-3" /> {editingStore.kontak || "Kontak tidak tersedia"}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-sm text-left">
                <p className="font-semibold mb-1 flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" /> Alamat</p>
                <p className="text-muted-foreground">{editingStore.alamat || "Belum diatur"}</p>
                <div className="mt-3 flex gap-4 text-xs font-mono text-muted-foreground">
                  <span>Lat: {editingStore.latitude || "-"}</span>
                  <span>Lng: {editingStore.longitude || "-"}</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};

export default AdminStoresPage;