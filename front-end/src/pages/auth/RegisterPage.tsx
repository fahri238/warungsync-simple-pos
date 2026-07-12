import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Truck,
  Store,
  MapPin,
  User,
  Phone,
  CheckCircle,
  CreditCard,
  CarFront,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/store";

const RegisterPage = () => {
  type Role = "customer" | "courier" | "store-owner";

  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");

  const [homeAddress, setHomeAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  const [nik, setNik] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [availableStores, setAvailableStores] = useState<
    { id: number; name: string }[]
  >([]);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [ktpFile, setKtpFile] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiFetch("/stores/list");
        if (res.data) setAvailableStores(res.data);
      } catch (e) {
        console.warn("Menunggu endpoint backend /stores/list dibuat...");
      }
    };
    fetchStores();

    const state = location.state as {
      latitude?: number;
      longitude?: number;
    } | null;
    if (state?.latitude != null && state?.longitude != null) {
      setLatitude(state.latitude);
      setLongitude(state.longitude);
    }

    const savedForm = sessionStorage.getItem("registerFormState");
    if (savedForm) {
      const parsed = JSON.parse(savedForm);
      if (parsed.role) setRole(parsed.role);
      if (parsed.name) setName(parsed.name);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.homeAddress) setHomeAddress(parsed.homeAddress);
      if (parsed.storeName) setStoreName(parsed.storeName);
      if (parsed.storeAddress) setStoreAddress(parsed.storeAddress);
      if (parsed.nik) setNik(parsed.nik);
      if (parsed.vehicleType) setVehicleType(parsed.vehicleType);
      if (parsed.vehiclePlate) setVehiclePlate(parsed.vehiclePlate);
      if (parsed.selectedStore) setSelectedStore(parsed.selectedStore);
    }
  }, [location.state]);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name || !email || !password || !phone) {
      toast.error("Isi semua field yang diwajibkan");
      return;
    }

    if (role === "courier") {
      if (!homeAddress) {
        toast.error("Kurir wajib mengisi alamat lengkap");
        return;
      }
      if (!nik || nik.length !== 16 || isNaN(Number(nik))) {
        toast.error("Kurir wajib mengisi NIK dengan 16 digit angka yang valid");
        return;
      }
      if (!vehicleType || !vehiclePlate) {
        toast.error("Kurir wajib mengisi tipe dan plat nomor kendaraan");
        return;
      }
      if (!selectedStore) {
        toast.error("Kurir wajib memilih toko tempat bekerja");
        return;
      }
    }

    if (role === "customer" && !homeAddress) {
      toast.error("Pembeli wajib mengisi alamat rumah");
      return;
    }

    if (role === "store-owner" && (!storeName || !storeAddress)) {
      toast.error("Pemilik toko wajib mengisi nama dan alamat toko");
      return;
    }

    if (
      (role === "customer" || role === "store-owner") &&
      (latitude == null || longitude == null)
    ) {
      toast.error("Pilih lokasi di peta sebelum melanjutkan");
      return;
    }

    if ((role === "courier" || role === "store-owner") && !ktpFile) {
      toast.error("Anda wajib mengunggah foto KTP untuk keperluan verifikasi!");
      return;
    }

    try {
      setSubmitting(true);

      let mappedRole = "pelanggan";
      if (role === "store-owner") mappedRole = "owner";
      else if (role === "courier") mappedRole = "kurir";

      let finalAddress = homeAddress;
      if (role === "store-owner") {
        finalAddress = `${storeName} - ${storeAddress}`;
      }

      let finalStoreId = "";
      if (mappedRole === "kurir") {
        finalStoreId = selectedStore;
      }

      const formData = new FormData();
      formData.append("nama", name);
      formData.append("email", email);
      formData.append("kata_sandi", password);
      formData.append("kontak", phone);
      formData.append("peran", mappedRole);
      formData.append("alamat", finalAddress);

      if (finalStoreId) formData.append("store_id", finalStoreId);
      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());
      if (mappedRole === "owner") formData.append("nama_toko", storeName);

      if (mappedRole === "kurir") {
        formData.append("nik", nik);
        formData.append("tipe_kendaraan", vehicleType);
        formData.append("plat_nomor", vehiclePlate);
      }

      if (ktpFile) formData.append("foto_ktp", ktpFile);

      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Gagal mendaftar");
        return;
      }

      toast.success(
        "Registrasi berhasil! Silakan periksa status akun Anda saat login.",
      );
      sessionStorage.removeItem("registerFormState");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  // REDESIGN: Membatasi layar (h-screen) dan memusatkan konten seperti halaman Login
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background overflow-hidden relative">
      {/* Background Decor (Optional) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]"
        aria-hidden
      />

      {/* Main Container - Dibuat max-width seperti Login, tapi konten dalamnya bisa di-scroll */}
      <div className="w-full max-w-xl px-4 py-6 sm:px-8 flex flex-col max-h-screen relative z-10">
        {/* Header Tetap di Atas */}
        <div className="shrink-0 mb-6 justify-center">
          <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-6 gap-1.5 text-muted-foreground"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke beranda
              </Link>
            </Button>

          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Daftar Akun Baru
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi data di bawah ini untuk bergabung.
          </p>
        </div>

        {/* Form Area - Bisa di-scroll internal (overflow-y-auto) tanpa menggeser halaman utama */}
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-border/80 bg-card shadow-xl shadow-primary/5 p-1 relative">
          <form onSubmit={handleRegister} className="space-y-6 p-5 sm:p-7">
            {/* Pemilihan Peran */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center block">
                Pilih Peran Anda
              </Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as Role)}
                className="grid grid-cols-3 gap-2 sm:gap-3"
              >
                {/* Opsi Pelanggan */}
                <div>
                  <RadioGroupItem
                    value="customer"
                    id="r-customer"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="r-customer"
                    className="flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-muted bg-transparent py-2.5 px-1 sm:p-3 text-[11px] sm:text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center"
                  >
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="font-medium leading-tight">Pembeli</span>
                  </Label>
                </div>
                {/* Opsi Owner */}
                <div>
                  <RadioGroupItem
                    value="store-owner"
                    id="r-store-owner"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="r-store-owner"
                    className="flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-muted bg-transparent py-2.5 px-1 sm:p-3 text-[11px] sm:text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center"
                  >
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="font-medium leading-tight">Toko</span>
                  </Label>
                </div>
                {/* Opsi Kurir */}
                <div>
                  <RadioGroupItem
                    value="courier"
                    id="r-courier"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="r-courier"
                    className="flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-muted bg-transparent py-2.5 px-1 sm:p-3 text-[11px] sm:text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center"
                  >
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="font-medium leading-tight">Kurir</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              {/* Grid 2 Kolom untuk Inputan Dasar agar menghemat ruang vertikal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda"
                      className="h-10 pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="h-10 pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">
                    No. HP
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxx"
                      className="h-10 pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 pl-9 pr-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* DYNAMIC FIELDS BERDASARKAN PERAN */}

              {/* Field Alamat Rumah (Customer & Courier) */}
              {(role === "customer" || role === "courier") && (
                <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <Label htmlFor="home-address" className="text-xs">
                    {role === "courier"
                      ? "Alamat Domisili Kurir"
                      : "Alamat Rumah"}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="home-address"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder={
                        role === "courier"
                          ? "Alamat saat ini"
                          : "Alamat lengkap pengiriman"
                      }
                      className="h-10 pl-9 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Field Toko (Owner) */}
              {role === "store-owner" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-name" className="text-xs">
                      Nama Toko
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="store-name"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Toko Anda"
                        className="h-10 pl-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="store-address" className="text-xs">
                      Alamat Toko
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="store-address"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        placeholder="Alamat lengkap"
                        className="h-10 pl-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Field KYC & Data Kurir (Courier) */}
              {role === "courier" && (
                <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-select" className="text-xs">
                      Toko Tempat Bekerja{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedStore}
                      onValueChange={setSelectedStore}
                    >
                      <SelectTrigger className="h-10 bg-background text-sm">
                        <SelectValue placeholder="Pilih toko penugasan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStores.length === 0 ? (
                          <SelectItem value="0" disabled>
                            Memuat toko...
                          </SelectItem>
                        ) : (
                          availableStores.map((store) => (
                            <SelectItem
                              key={store.id}
                              value={store.id.toString()}
                            >
                              {store.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nik" className="text-xs">
                      NIK KTP Lengkap
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nik"
                        value={nik}
                        onChange={(e) => setNik(e.target.value)}
                        placeholder="16 Digit NIK"
                        maxLength={16}
                        className="h-10 pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="vehicle-type" className="text-xs">
                        Tipe Motor
                      </Label>
                      <div className="relative">
                        <CarFront className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="vehicle-type"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          placeholder="Cth: Beat"
                          className="h-10 pl-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vehicle-plate" className="text-xs">
                        Nomor Plat
                      </Label>
                      <Input
                        id="vehicle-plate"
                        value={vehiclePlate}
                        onChange={(e) =>
                          setVehiclePlate(e.target.value.toUpperCase())
                        }
                        placeholder="Cth: DA 123 XY"
                        className="h-10 uppercase text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Dokumen KYC (Owner & Courier) */}
              {(role === "courier" || role === "store-owner") && (
                <div className="space-y-1.5 pt-4 border-t border-border/50 animate-in fade-in zoom-in-95 duration-200">
                  <Label
                    htmlFor="ktp-upload"
                    className="text-xs font-semibold uppercase text-primary"
                  >
                    Unggah Foto KTP Verifikasi{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ktp-upload"
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={(e) =>
                      setKtpFile(e.target.files ? e.target.files[0] : null)
                    }
                    className="h-9 cursor-pointer text-xs py-1.5 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:text-[10px] file:font-semibold file:text-primary"
                  />
                </div>
              )}

              {/* Pilih Lokasi Peta (Customer & Owner) */}
              {role === "customer" || role === "store-owner" ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 pt-3 flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
                  <div className="flex-1 text-center sm:text-left">
                    <Label className="text-xs font-semibold text-primary flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                      <MapPin className="h-3.5 w-3.5" />{" "}
                      {latitude
                        ? "Titik Lokasi Tersimpan"
                        : "Titik Lokasi Pengiriman"}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {latitude
                        ? `${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`
                        : "Tentukan koordinat untuk memudahkan pengiriman / pencarian."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={latitude ? "outline" : "default"}
                    className="w-full sm:w-auto text-xs h-9 shrink-0"
                    onClick={() => {
                      sessionStorage.setItem(
                        "registerFormState",
                        JSON.stringify({
                          role,
                          name,
                          email,
                          phone,
                          homeAddress,
                          storeName,
                          storeAddress,
                          nik,
                          vehicleType,
                          vehiclePlate,
                          selectedStore,
                        }),
                      );
                      navigate(`/register/location?role=${role}`, {
                        state: { latitude, longitude },
                      });
                    }}
                  >
                    {latitude ? "Ubah Titik Peta" : "Buka Peta"}
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-center mt-2">
                  <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" /> Kurir
                    tidak memerlukan titik lokasi statis.
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Submit Melayang di Bawah Box */}
            <div className="pt-2 sticky bottom-0 bg-card pb-2 border-t border-background mt-4 z-20">
              <Button
                type="submit"
                className="h-11 w-full font-bold shadow-md shadow-primary/20"
                disabled={submitting || loading}
              >
                {submitting
                  ? "Memproses Registrasi..."
                  : "Selesaikan Pendaftaran"}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer Text */}
        <div className="shrink-0 mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline transition-all"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
