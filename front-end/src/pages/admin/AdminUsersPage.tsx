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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/store";
import { toast } from "sonner";
import { getSession } from "@/lib/store";

// Tipe data Pengguna
interface UserData {
  id: number;
  nama: string;
  email: string;
  kontak: string;
  peran: "admin" | "owner" | "pelanggan" | "kurir";
  status: "aktif" | "nonaktif";
  store_id?: number | null;
}

const session = getSession();

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");

  // State untuk Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    kata_sandi: "", // Hanya diisi saat tambah atau ingin reset password
    kontak: "",
    peran: "pelanggan",
  });

  // Ambil Data dari API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/users");
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (error) {
      console.warn("API Kelola Pengguna belum siap, menggunakan data kosong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter pencarian dan peran
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.kontak && user.kontak.includes(searchQuery));

    const matchRole = roleFilter === "semua" || user.peran === roleFilter;

    return matchSearch && matchRole;
  });

  // Kalkulasi Statistik Mini
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.peran === "admin").length,
      owner: users.filter((u) => u.peran === "owner").length,
      kurir: users.filter((u) => u.peran === "kurir").length,
      pelanggan: users.filter((u) => u.peran === "pelanggan").length,
    };
  }, [users]);

  // Visual Helper untuk Peran
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return {
          icon: ShieldAlert,
          color: "text-red-600",
          bg: "bg-red-500/10",
          label: "Admin",
        };
      case "owner":
        return {
          icon: Store,
          color: "text-blue-600",
          bg: "bg-blue-500/10",
          label: "Owner",
        };
      case "kurir":
        return {
          icon: Bike,
          color: "text-orange-600",
          bg: "bg-orange-500/10",
          label: "Kurir",
        };
      case "pelanggan":
      default:
        return {
          icon: ShoppingBag,
          color: "text-green-600",
          bg: "bg-green-500/10",
          label: "Pelanggan",
        };
    }
  };

  // Handlers (Visual sementara)
  const openForm = (user: UserData | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nama: user.nama,
        email: user.email,
        kata_sandi: "", // Dikosongkan agar tidak mengubah sandi jika tidak diketik
        kontak: user.kontak || "",
        peran: user.peran,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nama: "",
        email: "",
        kata_sandi: "",
        kontak: "",
        peran: "pelanggan",
      });
    }
    setIsModalOpen(true);
  };

  // Handler Submit Form (Tambah/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await apiFetch(`/admin/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        if (res.success) toast.success(res.message);
      } else {
        const res = await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        if (res.success) toast.success(res.message);
      }
      setIsModalOpen(false);
      fetchUsers(); // Refresh tabel
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data pengguna");
    }
  };

  // Handler Hapus
  const handleDelete = async (id: number) => {
    if (
      confirm("Apakah Anda yakin ingin menghapus pengguna ini secara permanen?")
    ) {
      try {
        const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
        if (res.success) {
          toast.success(res.message);
          fetchUsers();
        }
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus pengguna");
      }
    }
  };

  // Handler Aktif/Nonaktif
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "nonaktif" ? "aktif" : "nonaktif";
    const labelStatus =
      newStatus === "aktif" ? "mengaktifkan" : "menonaktifkan";

    if (confirm(`Apakah Anda yakin ingin ${labelStatus} akun ini?`)) {
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
        toast.error(error.message || "Gagal mengubah status akun");
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
            <Users className="h-7 w-7 text-primary" />
            Manajemen Pengguna
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Kelola akses, peran, dan status akun seluruh pengguna di ekosistem
            WarungSync.
          </p>
        </div>
        <Button
          onClick={() => openForm()}
          className="relative z-10 shadow-lg shadow-primary/20"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-1">
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total User
            </p>
            <h3 className="text-2xl font-black">{stats.total}</h3>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-1">
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center mb-1">
              <ShieldAlert className="h-4 w-4 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-600">{stats.admin}</h3>
            <p className="text-xs font-medium text-muted-foreground">Admin</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-1">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-1">
              <Store className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-blue-600">{stats.owner}</h3>
            <p className="text-xs font-medium text-muted-foreground">Owner</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-1">
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-1">
              <Bike className="h-4 w-4 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-orange-600">{stats.kurir}</h3>
            <p className="text-xs font-medium text-muted-foreground">Kurir</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-1">
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-600">
              {stats.pelanggan}
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              Pelanggan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Tabel */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 border-b border-border/50">
          {/* Tabs Filter Peran */}
          <div className="flex bg-muted/50 p-1 rounded-lg w-full md:w-auto overflow-x-auto custom-scrollbar">
            {["semua", "admin", "owner", "kurir", "pelanggan"].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize whitespace-nowrap transition-all ${
                  roleFilter === role
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, atau HP..."
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
                  <th className="px-6 py-4 font-medium">Profil Pengguna</th>
                  <th className="px-6 py-4 font-medium">Peran</th>
                  <th className="px-6 py-4 font-medium">Status Akun</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <Activity className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                        <p>
                          Tidak ada pengguna yang cocok dengan pencarian atau
                          filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const RoleUI = getRoleBadge(user.peran);

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">
                            {user.nama}
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {user.email}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3" /> {user.kontak || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${RoleUI.bg} ${RoleUI.color}`}
                          >
                            <RoleUI.icon className="h-3.5 w-3.5" />
                            {RoleUI.label}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              user.status === "nonaktif"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-green-500/10 text-green-600"
                            }`}
                          >
                            {user.status === "nonaktif" ? "Nonaktif" : "Aktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                              onClick={() => openForm(user)}
                              title="Edit Data"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* LOGIKA PERLINDUNGAN: Cek apakah ID user di tabel sama dengan ID admin yang sedang login */}
                            {Number(session?.id) !== Number(user.id) ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${user.status === "nonaktif" ? "text-green-500 hover:bg-green-50" : "text-slate-500 hover:bg-slate-100"}`}
                                  onClick={() =>
                                    handleToggleStatus(
                                      user.id,
                                      user.status || "aktif",
                                    )
                                  }
                                  title="Toggle Status"
                                >
                                  {user.status === "nonaktif" ? (
                                    <Power className="h-4 w-4" />
                                  ) : (
                                    <PowerOff className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(user.id)}
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs italic text-muted-foreground px-2 py-1 bg-muted/50 rounded-md">
                                Akun Anda
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl border-primary/20">
            <CardHeader className="border-b border-border/50">
              <CardTitle>
                {editingUser ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input
                    required
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    placeholder="Nama pengguna..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      No. HP (Kontak)
                    </label>
                    <Input
                      required
                      value={formData.kontak}
                      onChange={(e) =>
                        setFormData({ ...formData, kontak: e.target.value })
                      }
                      placeholder="08123..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Peran / Hak Akses
                      {editingUser?.id === session?.id && (
                        <span className="text-xs text-orange-500 font-normal ml-2">
                          (Peran Anda dikunci)
                        </span>
                      )}
                    </label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted"
                      value={formData.peran}
                      onChange={(e) =>
                        setFormData({ ...formData, peran: e.target.value })
                      }
                      // KUNCI FRONTEND: Nonaktifkan pilihan jika ini adalah akun admin yang sedang login
                      disabled={Number(editingUser?.id) === Number(session?.id)}
                    >
                      <option value="pelanggan">Pelanggan</option>
                      <option value="kurir">Kurir</option>
                      <option value="owner">Owner (Pemilik Toko)</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Kata Sandi{" "}
                      {editingUser && (
                        <span className="text-xs text-muted-foreground font-normal">
                          (Kosongkan jika tak diubah)
                        </span>
                      )}
                    </label>
                    <Input
                      type="password"
                      required={!editingUser}
                      value={formData.kata_sandi}
                      onChange={(e) =>
                        setFormData({ ...formData, kata_sandi: e.target.value })
                      }
                      placeholder="Minimal 6 karakter"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
