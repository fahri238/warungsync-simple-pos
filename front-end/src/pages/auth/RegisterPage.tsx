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
  LayoutDashboard,
  Truck,
  Store,
  MapPin,
  User,
  Phone,
  CheckCircle,
  CreditCard,
  CarFront
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/store";

const highlights = [
  {
    icon: LayoutDashboard,
    title: "Admin & Kasir",
    desc: "Kelola inventaris, POS, dan pesanan masuk dari satu dasbor terpusat.",
  },
  {
    icon: ShoppingBag,
    title: "Pelanggan",
    desc: "Eksplorasi katalog warung sekitar dan pesan barang dari rumah.",
  },
  {
    icon: Truck,
    title: "Kurir",
    desc: "Sistem navigasi peta bawaan untuk mengantar pesanan lebih cepat.",
  },
];

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
  
  // Field Alamat & Toko
  const [homeAddress, setHomeAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  
  // Field Ekstra Khusus Kurir
  const [nik, setNik] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [availableStores, setAvailableStores] = useState<{id: number, name: string}[]>([]);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // STATE BARU: Untuk menyimpan file KTP
  const [ktpFile, setKtpFile] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch daftar toko untuk kurir
    const fetchStores = async () => {
      try {
        const res = await apiFetch("/stores/list");
        if (res.data) setAvailableStores(res.data);
      } catch (e) {
        console.warn("Menunggu endpoint backend /stores/list dibuat...");
      }
    };
    fetchStores();

    // Ambil Latitude & Longitude dari kembalian halaman peta
    const state = location.state as {
      latitude?: number;
      longitude?: number;
    } | null;

    if (state?.latitude != null && state?.longitude != null) {
      setLatitude(state.latitude);
      setLongitude(state.longitude);
    }

    // Tarik kembali data form yang disimpan di cache
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
      // Catatan: File KTP (ktpFile) sengaja tidak di-cache demi keamanan browser
    }
  }, [location.state]);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name || !email || !password || !phone) {
      toast.error("Isi semua field yang diwajibkan");
      return;
    }

    // Validasi Khusus Kurir
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

    // Validasi Pelanggan
    if (role === "customer" && !homeAddress) {
      toast.error("Pembeli wajib mengisi alamat rumah");
      return;
    }

    // Validasi Owner
    if (role === "store-owner" && (!storeName || !storeAddress)) {
      toast.error("Pemilik toko wajib mengisi nama dan alamat toko");
      return;
    }

    // Validasi Peta
    if (
      (role === "customer" || role === "store-owner") &&
      (latitude == null || longitude == null)
    ) {
      toast.error("Pilih lokasi di peta sebelum melanjutkan");
      return;
    }

    // VALIDASI BARU: Wajib Upload KTP untuk Kurir dan Owner
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

      // PERUBAHAN: MENGGUNAKAN FORMDATA KARENA MENGANDUNG FILE (KTP)
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
      
      if (mappedRole === "owner") {
        formData.append("nama_toko", storeName);
      }
      
      if (mappedRole === "kurir") {
        formData.append("nik", nik);
        formData.append("tipe_kendaraan", vehicleType);
        formData.append("plat_nomor", vehiclePlate);
      }
      
      if (ktpFile) {
        formData.append("foto_ktp", ktpFile);
      }

      // Kirim formData langsung ke fungsi register di AuthContext
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        body: formData, // Browser akan otomatis mengatur header Content-Type multipart/form-data
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Gagal mendaftar");
        return;
      }

      toast.success("Registrasi berhasil! Silakan periksa status akun Anda saat login.");
      sessionStorage.removeItem("registerFormState"); 
      navigate("/login");
      
    } catch (error: any) {
      toast.error(error?.message || "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen overflow-hidden lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-secondary lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,hsl(var(--primary)/0.25),transparent_50%)]" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="relative flex flex-1 flex-col px-10 py-12 xl:px-16 overflow-y-auto custom-scrollbar">
          <div className="mb-10">
            <WarungSyncLogo size="lg" className="[&_span]:text-secondary-foreground [&_span:last-child]:text-secondary-foreground/70" />
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold leading-[1.15] text-secondary-foreground xl:text-5xl">
              Satu Aplikasi untuk <br />
              <span className="text-primary">Semua Kebutuhan</span> Warung Anda.
            </h1>
            <p className="mt-5 text-lg text-secondary-foreground/80 leading-relaxed">
              Bergabunglah dengan ekosistem WarungSync. Mulai dari kelola stok, layani kasir, hingga antar pesanan online dengan Geomapping.
            </p>

            <div className="mt-8 flex items-center gap-6 border-b border-secondary-foreground/10 pb-8">
              <div>
                <h4 className="text-3xl font-bold text-primary">3</h4>
                <p className="text-sm font-medium text-secondary-foreground/80 mt-1">Pilihan Peran</p>
              </div>
              <div className="h-10 w-px bg-secondary-foreground/20"></div>
              <div>
                <h4 className="text-3xl font-bold text-primary">100%</h4>
                <p className="text-sm font-medium text-secondary-foreground/80 mt-1">Terintegrasi</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 max-w-md">
            {highlights.map((h) => (
              <div key={h.title} className="group flex items-start gap-4 rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-4 backdrop-blur-sm transition-all hover:bg-secondary-foreground/10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <h.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-secondary-foreground">{h.title}</p>
                  <p className="mt-1 text-sm text-secondary-foreground/70 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs font-medium text-secondary-foreground/40">
            © 2026 WarungSync — Platform untuk UMKM.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)] lg:hidden" aria-hidden />

        <div className="relative flex flex-1 min-h-0 flex-col justify-center px-4 py-8 sm:px-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-md">
            <Button variant="ghost" size="sm" className="-ml-2 mb-6 gap-1.5 text-muted-foreground hover:text-foreground" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke beranda
              </Link>
            </Button>

            <div className="mb-8 lg:hidden">
              <WarungSyncLogo size="md" />
            </div>

            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Daftar Akun Baru</h2>
              <p className="mt-2 text-muted-foreground">Lengkapi data di bawah ini untuk bergabung dengan WarungSync.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pilih Peran Anda</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <RadioGroupItem value="customer" id="r-customer" className="peer sr-only" />
                    <Label htmlFor="r-customer" className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-muted bg-transparent p-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center">
                      <ShoppingBag className="h-5 w-5 shrink-0" />
                      <span className="font-medium leading-tight">Pembeli</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="store-owner" id="r-store-owner" className="peer sr-only" />
                    <Label htmlFor="r-store-owner" className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-muted bg-transparent p-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center">
                      <Store className="h-5 w-5 shrink-0" />
                      <span className="font-medium leading-tight">Pemilik Toko</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="courier" id="r-courier" className="peer sr-only" />
                    <Label htmlFor="r-courier" className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-muted bg-transparent p-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all text-center">
                      <Truck className="h-5 w-5 shrink-0" />
                      <span className="font-medium leading-tight">Kurir</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-5 lg:grid-cols-1">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" autoComplete="name" className="h-11 pl-10" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="username" className="h-11 pl-10" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. HP</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxx" autoComplete="tel" className="h-11 pl-10" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" className="h-11 pl-10 pr-10" />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FIELD SPESIFIK: KURIR & PEMBELI (ALAMAT RUMAH) */}
                  {(role === "customer" || role === "courier") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="home-address">{role === "courier" ? "Alamat Domisili Kurir" : "Alamat Rumah"}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="home-address" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder={role === "courier" ? "Alamat domisili saat ini" : "Alamat rumah Anda"} autoComplete="street-address" className="h-11 pl-10" />
                      </div>
                    </div>
                  )}

                  {/* FIELD SPESIFIK: KURIR (KYC DATA & PILIH TOKO) */}
                  {role === "courier" && (
                    <div className="space-y-4 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verifikasi Identitas Kurir</Label>
                      
                      <div className="space-y-2">
                        <Label htmlFor="store-select">Pilih Toko Tempat Bekerja <span className="text-destructive">*</span></Label>
                        <Select value={selectedStore} onValueChange={setSelectedStore}>
                          <SelectTrigger className="h-11 bg-background">
                            <SelectValue placeholder="Pilih toko..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStores.length === 0 ? (
                              <SelectItem value="0" disabled>Memuat toko...</SelectItem>
                            ) : (
                              availableStores.map(store => (
                                <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nik">Nomor Induk Kependudukan (NIK)</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="nik" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="16 Digit NIK KTP Anda" maxLength={16} className="h-11 pl-10" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-type">Tipe Kendaraan</Label>
                          <div className="relative">
                            <CarFront className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input id="vehicle-type" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Contoh: Honda Beat Hitam" className="h-11 pl-10" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-plate">Nomor Plat</Label>
                          <Input id="vehicle-plate" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} placeholder="Contoh: DA 1234 XY" className="h-11 uppercase" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FIELD SPESIFIK: OWNER (DATA TOKO) */}
                  {role === "store-owner" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label htmlFor="store-name">Nama Toko</Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nama toko Anda" className="h-11 pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="store-address">Alamat Toko</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="store-address" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="Alamat lengkap toko" className="h-11 pl-10" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FIELD BARU: UPLOAD KTP UNTUK KURIR & OWNER */}
                  {(role === "courier" || role === "store-owner") && (
                    <div className="space-y-4 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                       <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dokumen Verifikasi (KYC)</Label>
                       <div className="space-y-2">
                         <Label htmlFor="ktp-upload">Unggah Foto KTP Jelas <span className="text-destructive">*</span></Label>
                         <Input 
                           id="ktp-upload" 
                           type="file" 
                           accept="image/jpeg, image/png, image/jpg"
                           onChange={(e) => setKtpFile(e.target.files ? e.target.files[0] : null)}
                           className="h-11 cursor-pointer pt-2.5 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20" 
                         />
                         <p className="text-[10px] text-muted-foreground">Maksimal 5MB. Format: JPG, PNG.</p>
                       </div>
                    </div>
                  )}

                  <Button type="submit" className="h-11 w-full text-base shadow-md shadow-primary/20" disabled={submitting || loading}>
                    {submitting ? "Memproses..." : "Daftar Sekarang"}
                  </Button>
                </div>

                <div className="space-y-5">
                  {role === "customer" || role === "store-owner" ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
                      <MapPin className="absolute -bottom-4 -right-4 h-24 w-24 text-primary/10" />
                      <Label className="text-base font-semibold text-primary flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Titik Lokasi Peta
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground relative z-10">
                        {role === "customer" ? "Tentukan titik rumah Anda di peta agar kurir mudah menemukan alamat saat pengiriman." : "Tentukan lokasi toko Anda di peta agar pelanggan mudah menemukannya."}
                      </p>
                      <Button
                        type="button"
                        variant={latitude ? "outline" : "default"}
                        className="mt-4 h-11 w-full relative z-10"
                        onClick={() => {
                          sessionStorage.setItem("registerFormState", JSON.stringify({ role, name, email, phone, homeAddress, storeName, storeAddress, nik, vehicleType, vehiclePlate, selectedStore }));
                          navigate(`/register/location?role=${role}`, { state: { latitude, longitude } });
                        }}
                      >
                        {latitude != null && longitude != null ? "Ubah Lokasi di Peta" : "Pilih Lokasi di Peta"}
                      </Button>
                      {latitude != null && longitude != null ? (
                        <div className="mt-3 inline-block rounded-md bg-background px-3 py-1.5 border text-xs font-mono text-muted-foreground relative z-10">
                          {latitude.toFixed(5)}, {longitude.toFixed(5)}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/50 p-4 text-center">
                      <p className="text-sm text-foreground flex items-center justify-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Kurir tidak memerlukan titik peta statis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;