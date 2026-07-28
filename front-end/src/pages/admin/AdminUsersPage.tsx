import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ShieldAlert,
  Store,
  Bike,
  ShoppingBag,
  Activity,
  AlertCircle,
  Mail,
  Phone,
  CheckCircle,
  Landmark,
  Plus,
  MapPin,
  MapPinned,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import { apiFetch, getSession } from "@/lib/store";
import { toast } from "sonner";
import DeliveryLocationPicker from "@/components/maps/DeliveryLocationPicker";

interface UserData {
  id: number;
  nama: string;
  email: string;
  kontak: string;
  peran: "admin" | "owner" | "pelanggan" | "kurir";
  status: "aktif" | "nonaktif";
  store_id?: number | null;
  is_approved?: number;
  nik?: string;
  tipe_kendaraan?: string;
  plat_nomor?: string;
  nama_toko?: string;
  alamat_toko?: string;
  kategori_toko?: string;
  foto_ktp?: string;
  foto_warung?: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_CENTER: [number, number] = [-3.316694, 114.590111];

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stores, setStores] = useState<{ id: number; nama: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedOwnerForBank, setSelectedOwnerForBank] =
    useState<UserData | null>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [newBankName, setNewBankName] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccName, setNewAccName] = useState("");

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // STATE UNTUK ALERT DIALOG (Pengganti window.confirm)
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    actionText: string;
    actionVariant: "default" | "destructive";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    desc: "",
    actionText: "",
    actionVariant: "default",
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    kata_sandi: "",
    kontak: "",
    peran: "pelanggan",
    nik: "",
    tipe_kendaraan: "",
    plat_nomor: "",
    store_id: "",
    nama_toko: "",
    alamat_toko: "",
    latitude: "",
    longitude: "",
  });
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [warungFile, setWarungFile] = useState<File | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/users");
      if (res.success) setUsers(res.data);
      const resStores = await apiFetch("/stores/list");
      if (resStores.data) setStores(resStores.data);
    } catch (error) {
      toast.error("Gagal mengambil data sistem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "semua" || user.peran === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.peran === "admin").length,
      owner: users.filter((u) => u.peran === "owner").length,
      kurir: users.filter((u) => u.peran === "kurir").length,
      pelanggan: users.filter((u) => u.peran === "pelanggan").length,
    }),
    [users],
  );

  // HELPER UNTUK MEMANGGIL ALERT DIALOG
  const confirmAction = (
    title: string,
    desc: string,
    actionText: string,
    actionVariant: "default" | "destructive",
    onConfirm: () => void,
  ) => {
    setAlertConfig({
      isOpen: true,
      title,
      desc,
      actionText,
      actionVariant,
      onConfirm: () => {
        onConfirm();
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const openForm = (user: UserData | null = null) => {
    setKtpFile(null);
    setWarungFile(null);
    if (user) {
      setEditingUser(user);
      setFormData({
        nama: user.nama,
        email: user.email,
        kata_sandi: "",
        kontak: user.kontak || "",
        peran: user.peran,
        nik: user.nik || "",
        tipe_kendaraan: user.tipe_kendaraan || "",
        plat_nomor: user.plat_nomor || "",
        store_id: user.store_id?.toString() || "",
        nama_toko: user.nama_toko || "",
        alamat_toko: user.alamat_toko || "",
        latitude: user.latitude?.toString() || "",
        longitude: user.longitude?.toString() || "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        nama: "",
        email: "",
        kata_sandi: "",
        kontak: "",
        peran: "pelanggan",
        nik: "",
        tipe_kendaraan: "",
        plat_nomor: "",
        store_id: "",
        nama_toko: "",
        alamat_toko: "",
        latitude: "",
        longitude: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenMap = () => {
    const lat = formData.latitude ? Number(formData.latitude) : null;
    const lng = formData.longitude ? Number(formData.longitude) : null;
    setTempLat(lat);
    setTempLng(lng);
    setMapCenter(lat && lng ? [lat, lng] : DEFAULT_CENTER);
    setIsMapModalOpen(true);
  };

  const handleSaveMap = () => {
    if (tempLat == null || tempLng == null)
      return toast.error("Tancapkan pin lokasi di peta terlebih dahulu.");
    setFormData({
      ...formData,
      latitude: tempLat.toString(),
      longitude: tempLng.toString(),
    });
    setIsMapModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOwner = formData.peran === "owner";
    const isCourier = formData.peran === "kurir";

    if (isOwner && !editingUser && (!ktpFile || !warungFile))
      return toast.error("Owner baru WAJIB upload KTP dan Foto Warung!");
    if (isCourier && !editingUser && !ktpFile)
      return toast.error("Kurir baru WAJIB upload KTP!");
    if (isCourier && !formData.store_id)
      return toast.error("Pilih Toko tempat Kurir bekerja!");
    if (isOwner && (!formData.latitude || !formData.longitude))
      return toast.error("Titik koordinat Toko wajib diisi melalui Peta!");

    const payload = new FormData();
    payload.append("nama", formData.nama);
    payload.append("email", formData.email);
    payload.append("kontak", formData.kontak);
    payload.append("peran", formData.peran);
    if (formData.kata_sandi) payload.append("kata_sandi", formData.kata_sandi);

    if (isOwner) {
      payload.append("nama_toko", formData.nama_toko);
      payload.append("alamat_toko", formData.alamat_toko);
      payload.append("latitude", formData.latitude);
      payload.append("longitude", formData.longitude);
      if (warungFile) payload.append("foto_warung", warungFile);
    }
    if (isCourier) {
      payload.append("nik", formData.nik);
      payload.append("tipe_kendaraan", formData.tipe_kendaraan);
      payload.append("plat_nomor", formData.plat_nomor);
      payload.append("store_id", formData.store_id);
    }
    if ((isOwner || isCourier) && ktpFile) payload.append("foto_ktp", ktpFile);

    try {
      const currentSession = getSession();
      if (!currentSession?.token)
        throw new Error("Sesi login Anda telah habis.");

      const url = editingUser
        ? `http://localhost:5000/api/admin/users/${editingUser.id}`
        : `http://localhost:5000/api/admin/users`;

      const res = await fetch(url, {
        method: editingUser ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${currentSession.token}` },
        body: payload,
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setIsModalOpen(false);
        fetchUsers();
      } else throw new Error(data.message);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data pengguna");
    }
  };

  const handleDelete = (id: number) => {
    confirmAction(
      "Hapus Pengguna?",
      "Tindakan ini akan menghapus akun secara permanen. Lanjutkan?",
      "Hapus",
      "destructive",
      async () => {
        try {
          const res = await apiFetch(`/admin/users/${id}`, {
            method: "DELETE",
          });
          if (res.success) {
            toast.success(res.message);
            fetchUsers();
          }
        } catch (error: any) {
          toast.error(error.message);
        }
      },
    );
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "nonaktif" ? "aktif" : "nonaktif";
    const statusText = newStatus === "aktif" ? "mengaktifkan" : "menonaktifkan";

    confirmAction(
      "Ubah Status Akun?",
      `Apakah Anda yakin ingin ${statusText} akun ini?`,
      "Ya, Ubah Status",
      newStatus === "nonaktif" ? "destructive" : "default",
      async () => {
        try {
          const res = await apiFetch(`/admin/users/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          });
          if (res.success) {
            toast.success(res.message);
            fetchUsers();
          }
        } catch (error: any) {
          toast.error(error.message);
        }
      },
    );
  };

  const handleApproveCourier = (id: number) => {
    confirmAction(
      "Setujui Pendaftaran?",
      "Kurir ini akan mendapatkan izin untuk mulai mengantar pesanan.",
      "Setujui Kurir",
      "default",
      async () => {
        try {
          const res = await apiFetch(`/admin/courier/${id}/approve`, {
            method: "PUT",
          });
          if (res.success) {
            toast.success(res.message);
            fetchUsers();
          }
        } catch (error: any) {
          toast.error(error.message);
        }
      },
    );
  };

  const openBankModal = async (owner: UserData) => {
    setSelectedOwnerForBank(owner);
    setIsBankModalOpen(true);
    try {
      const res = await apiFetch(`/admin/banks/${owner.store_id}`);
      setBanks(res.data || []);
    } catch (e) {
      setBanks([]);
    }
  };

  const handleAddBank = async () => {
    if (!newBankName || !newAccNumber)
      return toast.error("Lengkapi data rekening!");
    try {
      await apiFetch(`/admin/banks/${selectedOwnerForBank?.store_id}`, {
        method: "POST",
        body: JSON.stringify({
          bank_name: newBankName,
          account_number: newAccNumber,
          account_name: newAccName || selectedOwnerForBank?.nama,
        }),
      });
      toast.success("Rekening ditambahkan");
      setNewBankName("");
      setNewAccNumber("");
      setNewAccName("");
      openBankModal(selectedOwnerForBank!);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteBank = (id: number) => {
    confirmAction(
      "Hapus Rekening?",
      "Apakah Anda yakin ingin menghapus rekening ini? Tindakan ini tidak dapat dibatalkan.",
      "Hapus Rekening",
      "destructive",
      async () => {
        try {
          await apiFetch(`/admin/banks/delete/${id}`, { method: "DELETE" });
          toast.success("Rekening dihapus");
          openBankModal(selectedOwnerForBank!);
        } catch (error: any) {
          toast.error(error.message);
        }
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-10">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl bg-primary/5 p-6 border border-primary/10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Manajemen Pengguna
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola akses, dokumen KYC, dan status akun seluruh ekosistem.
          </p>
        </div>
        <Button
          onClick={() => openForm()}
          className="relative z-10 shadow-lg shadow-primary/20"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 border-b border-border/50">
          <div className="flex bg-muted/50 p-1 rounded-lg w-full md:w-auto overflow-x-auto custom-scrollbar">
            {["semua", "admin", "owner", "kurir", "pelanggan"].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize ${roleFilter === role ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4">Profil Pengguna</th>
                  <th className="px-6 py-4">Peran & Toko</th>
                  <th className="px-6 py-4">Status & Verifikasi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <Activity className="h-6 w-6 animate-spin mx-auto opacity-50" />
                      Memuat...
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{user.nama}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <Mail className="inline h-3 w-3 mr-1" /> {user.email}{" "}
                          <br />
                          <Phone className="inline h-3 w-3 mr-1" />{" "}
                          {user.kontak || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold uppercase text-[10px] bg-primary/10 text-primary px-2 py-1 rounded">
                          {user.peran}
                        </span>
                        {(user.peran === "owner" || user.peran === "kurir") && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              <Store className="inline h-3 w-3 mr-1" />{" "}
                              {user.nama_toko || "Store ID: " + user.store_id}
                            </p>
                            {/* 👈 FITUR BARU: Tampilkan Kategori Toko Hanya Untuk Owner */}
                            {user.peran === "owner" && user.kategori_toko && (
                              <div className="mt-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-bold border border-border/80 uppercase tracking-wider">
                                  {user.kategori_toko}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${user.status === "nonaktif" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}
                        >
                          {user.status === "nonaktif" ? "Nonaktif" : "Aktif"}
                        </span>
                        <br />
                        {(user.peran === "owner" || user.peran === "kurir") && (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${user.is_approved ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"}`}
                          >
                            {user.is_approved ? "Verified" : "Pending KYC"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.peran === "kurir" && !user.is_approved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveCourier(user.id)}
                              className="text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-100 mr-2"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                              Approve
                            </Button>
                          )}
                          {user.peran === "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openBankModal(user)}
                              title="Kelola Rekening"
                            >
                              <Landmark className="h-4 w-4 text-indigo-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(user)}
                          >
                            <Edit className="h-4 w-4 text-orange-500" />
                          </Button>
                          {Number(getSession()?.id) !== Number(user.id) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleToggleStatus(
                                    user.id,
                                    user.status || "aktif",
                                  )
                                }
                              >
                                {user.status === "nonaktif" ? (
                                  <Power className="h-4 w-4 text-green-500" />
                                ) : (
                                  <PowerOff className="h-4 w-4 text-slate-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  required
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>No. HP</Label>
                <Input
                  required
                  value={formData.kontak}
                  onChange={(e) =>
                    setFormData({ ...formData, kontak: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Kata Sandi{" "}
                  {editingUser && (
                    <span className="text-[10px] text-muted-foreground">
                      (Abaikan jika tak diubah)
                    </span>
                  )}
                </Label>
                <Input
                  type="password"
                  required={!editingUser}
                  value={formData.kata_sandi}
                  onChange={(e) =>
                    setFormData({ ...formData, kata_sandi: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Hak Akses / Peran</Label>
              <Select
                disabled={Number(editingUser?.id) === Number(getSession()?.id)}
                value={formData.peran}
                onValueChange={(v: any) =>
                  setFormData({ ...formData, peran: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pelanggan">Pelanggan</SelectItem>
                  <SelectItem value="kurir">Kurir</SelectItem>
                  <SelectItem value="owner">Owner (Toko)</SelectItem>
                  <SelectItem value="admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.peran === "owner" && (
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border animate-in fade-in zoom-in-95">
                <div className="space-y-2">
                  <Label>Nama Toko</Label>
                  <Input
                    required
                    value={formData.nama_toko}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_toko: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alamat Toko</Label>
                  <Input
                    required
                    value={formData.alamat_toko}
                    onChange={(e) =>
                      setFormData({ ...formData, alamat_toko: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2 p-3 bg-background rounded-lg border border-border/80 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="w-full space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Latitude
                    </Label>
                    <Input
                      readOnly
                      placeholder="Belum diatur"
                      value={formData.latitude}
                      className="h-8 bg-muted/30 cursor-not-allowed"
                    />
                  </div>
                  <div className="w-full space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Longitude
                    </Label>
                    <Input
                      readOnly
                      placeholder="Belum diatur"
                      value={formData.longitude}
                      className="h-8 bg-muted/30 cursor-not-allowed"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenMap}
                    className="shrink-0 h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <MapPinned className="h-3 w-3" /> Buka Peta
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Ubah Foto KTP</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ubah Foto Warung</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWarungFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {formData.peran === "kurir" && (
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border animate-in fade-in zoom-in-95">
                <div className="space-y-2">
                  <Label>Toko Penugasan</Label>
                  <Select
                    value={formData.store_id}
                    onValueChange={(v) =>
                      setFormData({ ...formData, store_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Toko" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NIK KTP</Label>
                  <Input
                    required
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) =>
                      setFormData({ ...formData, nik: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Kendaraan</Label>
                  <Input
                    required
                    value={formData.tipe_kendaraan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipe_kendaraan: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plat Nomor</Label>
                  <Input
                    required
                    value={formData.plat_nomor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plat_nomor: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Ubah Foto KTP</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan Data</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="p-4 border-b bg-card">
            <DialogTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-primary" /> Pilih Titik Lokasi
              Toko
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 relative bg-muted/20 cursor-crosshair">
            <DeliveryLocationPicker
              latitude={tempLat}
              longitude={tempLng}
              mapCenter={mapCenter}
              onChange={(lat, lng) => {
                setTempLat(lat);
                setTempLng(lng);
              }}
              height="100%"
            />
          </div>

          <DialogFooter className="p-4 border-t bg-card flex sm:justify-between items-center">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Seret peta atau ketuk area untuk menancapkan pin.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsMapModalOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleSaveMap}>
                <CheckCircle className="h-4 w-4 mr-2" /> Terapkan Koordinat
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL KELOLA REKENING */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" /> Kelola Rekening
              Owner
            </DialogTitle>
            <DialogDescription>
              Admin Support untuk Toko: {selectedOwnerForBank?.nama_toko}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nama Bank"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
              />

              {/* PERBAIKAN: Input tipe number khusus rekening */}
              <Input
                type="number"
                placeholder="No Rekening"
                value={newAccNumber}
                onChange={(e) => setNewAccNumber(e.target.value)}
              />

              <Button onClick={handleAddBank}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
              {banks.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Belum ada rekening
                </p>
              ) : (
                banks.map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between items-center p-3 border rounded-lg bg-muted/20"
                  >
                    <div>
                      <p className="font-bold text-sm">
                        {b.bank_name} - {b.account_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        a.n {b.account_name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBank(b.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KOMPONEN ALERT DIALOG UNTUK KONFIRMASI TINDAKAN PENTING */}
      <AlertDialog
        open={alertConfig.isOpen}
        onOpenChange={(open) =>
          setAlertConfig((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={alertConfig.onConfirm}
              className={
                alertConfig.actionVariant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {alertConfig.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default AdminUsersPage;
