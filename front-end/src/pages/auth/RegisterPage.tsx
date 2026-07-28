import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DeliveryLocationPicker from "@/components/maps/DeliveryLocationPicker";
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
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/store";

const RegisterPage = () => {
  type Role = "customer" | "courier" | "store-owner";

  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");

  const [homeAddress, setHomeAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // PERBAIKAN: Hanya ada satu deklarasi storeCategory di sini
  const [storeCategory, setStoreCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

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
  const [storePhoto, setStorePhoto] = useState<File | null>(null);

  // State untuk Peta Modal
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -3.316694, 114.590111,
  ]);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Penanda apakah role saat ini mewajibkan dokumen T&C
  const requiresTerms = role === "store-owner" || role === "courier";

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiFetch("/stores/list");
        if (res.data) setAvailableStores(res.data);
      } catch (e) {
        console.warn("Menunggu endpoint /stores/list");
      }
    };
    fetchStores();

    // Hapus logika sessionStorage untuk map lama agar tidak mengganggu pop-up modal
  }, []);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // VALIDASI PERSETUJUAN (Hanya untuk Owner & Kurir)
    if (requiresTerms && !termsAccepted) {
      toast.error(
        "Anda harus menyetujui Syarat & Ketentuan untuk melanjutkan.",
      );
      return;
    }

    if (!name || !email || !password || !phone) {
      toast.error("Isi semua field yang diwajibkan");
      return;
    }

    if (role === "courier") {
      if (!homeAddress)
        return toast.error("Kurir wajib mengisi alamat lengkap");
      if (!nik || nik.length !== 16 || isNaN(Number(nik)))
        return toast.error(
          "Kurir wajib mengisi NIK dengan 16 digit angka yang valid",
        );
      if (!vehicleType || !vehiclePlate)
        return toast.error("Kurir wajib mengisi tipe dan plat nomor kendaraan");
      if (!selectedStore)
        return toast.error("Kurir wajib memilih toko tempat bekerja");
      if (!ktpFile) return toast.error("Foto KTP wajib diunggah!");
    }

    if (role === "customer" && !homeAddress)
      return toast.error("Pembeli wajib mengisi alamat rumah");

    if (role === "store-owner") {
      if (!storeName || !storeAddress)
        return toast.error("Pemilik toko wajib mengisi nama dan alamat toko");
      if (!storeCategory) return toast.error("Pilih klasifikasi toko Anda!");
      if (storeCategory === "Lainnya" && !customCategory.trim())
        return toast.error("Isi kategori manual untuk toko Anda!");
      if (!ktpFile) return toast.error("Anda wajib mengunggah foto KTP!");
      if (!storePhoto)
        return toast.error("Anda wajib mengunggah foto tampak depan warung!");
    }

    if (
      (role === "customer" || role === "store-owner") &&
      (latitude == null || longitude == null)
    ) {
      return toast.error("Pilih lokasi di peta sebelum melanjutkan");
    }

    try {
      setSubmitting(true);

      let mappedRole = "pelanggan";
      if (role === "store-owner") mappedRole = "owner";
      else if (role === "courier") mappedRole = "kurir";

      let finalAddress = homeAddress;
      if (role === "store-owner")
        finalAddress = `${storeName} - ${storeAddress}`;

      const formData = new FormData();
      formData.append("nama", name);
      formData.append("email", email);
      formData.append("kata_sandi", password);
      formData.append("kontak", phone);
      formData.append("peran", mappedRole);
      formData.append("alamat", finalAddress);

      if (mappedRole === "kurir") formData.append("store_id", selectedStore);
      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());

      if (mappedRole === "owner") {
        formData.append("nama_toko", storeName);
        const finalCategory =
          storeCategory === "Lainnya" ? customCategory : storeCategory;
        formData.append("kategori_toko", finalCategory);
      }

      if (mappedRole === "kurir") {
        formData.append("nik", nik);
        formData.append("tipe_kendaraan", vehicleType);
        formData.append("plat_nomor", vehiclePlate);
      }

      if (ktpFile) formData.append("foto_ktp", ktpFile);
      if (storePhoto && mappedRole === "owner")
        formData.append("foto_warung", storePhoto);

      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Gagal mendaftar");
        return;
      }

      toast.success(data.message || "Registrasi berhasil!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting || loading || (requiresTerms && !termsAccepted);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background overflow-hidden relative">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]"
        aria-hidden
      />

      <div className="w-full max-w-xl px-4 py-6 sm:px-8 flex flex-col max-h-screen relative z-10">
        <div className="shrink-0 mb-6 justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-6 gap-1.5 text-muted-foreground"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
            </Link>
          </Button>

          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Daftar Akun Baru
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi data di bawah ini untuk bergabung.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-border/80 bg-card shadow-xl shadow-primary/5 p-1 relative">
          <form onSubmit={handleRegister} className="space-y-6 p-5 sm:p-7">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center block">
                Pilih Peran Anda
              </Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => {
                  setRole(v as Role);
                  setTermsAccepted(false);
                }}
                className="grid grid-cols-3 gap-2 sm:gap-3"
              >
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

                  {/* INPUT KATEGORI TOKO */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Klasifikasi Toko{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={storeCategory}
                      onValueChange={setStoreCategory}
                    >
                      <SelectTrigger className="h-10 bg-background text-sm">
                        <SelectValue placeholder="Pilih jenis toko..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sembako & Kebutuhan Pokok">
                          Sembako & Kebutuhan Pokok
                        </SelectItem>
                        <SelectItem value="Makanan & Minuman">
                          Makanan & Minuman
                        </SelectItem>
                        <SelectItem value="Apotek & Obat-obatan">
                          Apotek / Obat-obatan
                        </SelectItem>
                        <SelectItem value="Toko Bangunan">
                          Toko Bangunan
                        </SelectItem>
                        <SelectItem value="Lainnya">
                          Kategori Lainnya (Ketik Manual)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Input text muncul hanya jika memilih "Lainnya" */}
                    {storeCategory === "Lainnya" && (
                      <Input
                        placeholder="Ketik kategori toko Anda..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="h-10 mt-2 bg-background text-sm animate-in fade-in slide-in-from-top-2"
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
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

              {/* MAP LOKASI */}
              {role === "customer" || role === "store-owner" ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 pt-3 flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
                  <div className="flex-1 text-center sm:text-left">
                    <Label className="text-xs font-semibold text-primary flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                      <MapPin className="h-3.5 w-3.5" />{" "}
                      {latitude ? "Titik Lokasi Tersimpan" : "Titik Lokasi"}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {latitude
                        ? `${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`
                        : "Tentukan koordinat di peta."}
                    </p>
                  </div>
                  {/* TOMBOL BUKA MODAL PETA */}
                  <Button
                    type="button"
                    size="sm"
                    variant={latitude ? "outline" : "default"}
                    className="w-full sm:w-auto text-xs h-9 shrink-0"
                    onClick={() => setIsMapOpen(true)}
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

              {role === "store-owner" && (
                <div className="space-y-1.5 pt-2 animate-in fade-in zoom-in-95 duration-200">
                  <Label
                    htmlFor="warung-upload"
                    className="text-xs font-semibold uppercase text-primary"
                  >
                    Unggah Foto Warung (Tampak Depan){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="warung-upload"
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={(e) =>
                      setStorePhoto(e.target.files ? e.target.files[0] : null)
                    }
                    className="h-9 cursor-pointer text-xs py-1.5 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:text-[10px] file:font-semibold file:text-primary"
                  />
                </div>
              )}
            </div>

            {/* CHECKBOX SYARAT DAN KETENTUAN */}
            {requiresTerms && (
              <div className="flex items-start space-x-3 pt-4 border-t border-border/50 animate-in fade-in zoom-in-95">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/20 bg-background cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-muted-foreground leading-relaxed select-none"
                >
                  Saya menyetujui{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(true)}
                    className="text-primary hover:underline font-bold"
                  >
                    Dokumen Syarat & Ketentuan
                  </button>{" "}
                  serta Kebijakan Privasi penggunaan platform WarungSync.
                </label>
              </div>
            )}

            <div className="pt-2 sticky bottom-0 bg-card pb-2 mt-4 z-20">
              <Button
                type="submit"
                className={`h-11 w-full font-bold shadow-md transition-all ${isSubmitDisabled ? "opacity-50 grayscale cursor-not-allowed" : "shadow-primary/20"}`}
                disabled={isSubmitDisabled}
              >
                {submitting
                  ? "Memproses Registrasi..."
                  : "Selesaikan Pendaftaran"}
              </Button>
            </div>
          </form>
        </div>

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

      {/* POP-UP / MODAL PETA GEOMAPPING */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Tentukan Lokasi Anda
            </DialogTitle>
            <DialogDescription>
              Geser peta atau klik pada lokasi untuk menempatkan pin merah
              secara akurat.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border/50 shadow-inner mt-2">
            <DeliveryLocationPicker
              latitude={latitude}
              longitude={longitude}
              mapCenter={mapCenter}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              height="100%"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setIsMapOpen(false)}
              className="w-full font-bold"
            >
              Simpan & Tutup Peta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POP-UP / MODAL SYARAT DAN KETENTUAN */}
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Dokumen Persetujuan
            </DialogTitle>
            <DialogDescription>
              Syarat & Ketentuan Penggunaan Layanan WarungSync
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar text-sm text-muted-foreground pr-4">
            <div className="space-y-2">
              <h4 className="font-bold text-foreground">
                1. Biaya Layanan & Komisi (Admin Fee)
              </h4>
              <p>
                Untuk mendukung biaya pemeliharaan aplikasi, pengambangan fitur,
                dan operasional server WarungSync, sistem akan mengenakan
                potongan otomatis sebesar{" "}
                <strong>5% dari total setiap transaksi</strong> yang berhasil
                diselesaikan melalui platform ini. Dengan mendaftar sebagai
                Pemilik Toko, Anda menyetujui kebijakan pemotongan ini.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-foreground">
                2. Keamanan & Privasi Data Pengguna
              </h4>
              <p>
                Seluruh dokumen sensitif yang diunggah ke dalam sistem, termasuk
                namun tidak terbatas pada{" "}
                <strong>Foto KTP, Data Rekening Bank, dan Foto Warung</strong>,
                disimpan secara rahasia dan aman. Data tersebut murni digunakan
                untuk keperluan verifikasi identitas (KYC) internal guna
                mencegah penipuan, dan{" "}
                <strong>
                  sama sekali tidak akan diperjualbelikan atau disalahgunakan
                </strong>{" "}
                oleh pihak ketiga.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-row items-center border-t pt-4">
            <Button variant="ghost" onClick={() => setIsTermsOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setTermsAccepted(true);
                setIsTermsOpen(false);
              }}
              className="font-bold"
            >
              Saya Mengerti & Setuju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterPage;
