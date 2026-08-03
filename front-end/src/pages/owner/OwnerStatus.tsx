import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, apiFetch } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/custom-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  XCircle,
  CheckCircle2,
  RotateCcw,
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  ShieldAlert,
  Store,
  Tags
} from "lucide-react";

const OwnerStatus = () => {
  const session = getSession();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [userData, setUserData] = useState<any>(session);
  const [storeData, setStoreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mengambil data lengkap User dan Toko
  useEffect(() => {
    const fetchCompleteData = async () => {
      try {
        const userRes = await apiFetch("/users/me");
        if (userRes.data) {
          setUserData(userRes.data);
          
          if (userRes.data.store_id) {
            const storeRes = await apiFetch("/stores/list");
            const matchedStore = storeRes.data?.find((s: any) => Number(s.id) === Number(userRes.data.store_id));
            if (matchedStore) {
              setStoreData(matchedStore);
            }
          }
        }
      } catch (error) {
        console.error("Gagal memuat data lengkap owner:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompleteData();
  }, []);

  const handleDeleteAndReRegister = async () => {
    try {
      setIsDeleting(true);
      await apiFetch("/users/me", { method: "DELETE" });
      toast.success("Akun dan data toko sebelumnya telah dihapus. Silakan daftar ulang.");
      logout();
      navigate("/register");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menghapus akun.");
      setIsDeleting(false);
    }
  };

  const isApproved = userData?.is_approved === 1;
  const isRejected = userData?.status === "ditolak";

  const DataRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[85vh] w-full p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* KOLOM KIRI: STATUS PENGAJUAN */}
          <div className="xl:col-span-5 flex flex-col gap-6 xl:sticky xl:top-8">
            <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-card/90 backdrop-blur-xl">
              <div className={`h-3 w-full ${isApproved ? 'bg-green-500' : isRejected ? 'bg-destructive' : 'bg-primary'}`} />
              <CardContent className="pt-10 pb-8 px-6 text-center">
                
                <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-6 ring-8 ${
                  isApproved ? 'bg-green-100 ring-green-50' : 
                  isRejected ? 'bg-destructive/10 ring-destructive/5' : 
                  'bg-primary/10 ring-primary/5 animate-pulse'
                }`}>
                  {isApproved ? <CheckCircle2 className="h-12 w-12 text-green-600" /> :
                   isRejected ? <XCircle className="h-12 w-12 text-destructive" /> :
                   <Clock className="h-12 w-12 text-primary" />}
                </div>

                <h2 className="text-2xl font-black mb-3 text-foreground tracking-tight">
                  {isApproved ? "Status: Aktif" : isRejected ? "Pengajuan Ditolak" : "Sedang Diverifikasi"}
                </h2>

                <p className="text-muted-foreground text-sm mb-8 leading-relaxed px-2">
                  {isApproved 
                    ? "Selamat! Pendaftaran toko Anda telah disetujui oleh Super Admin. Anda sekarang memiliki akses penuh."
                    : isRejected 
                    ? "Mohon maaf, pendaftaran toko Anda ditolak oleh tim Admin kami."
                    : "Data KTP dan profil toko Anda sedang ditinjau oleh tim Admin WarungSync (Maks 1x24 jam)."}
                </p>

                <div className="bg-muted/30 border border-border/50 rounded-xl p-5 mb-8 shadow-inner text-left">
                  {isRejected ? (
                    <>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" /> Catatan Verifikator Admin
                      </p>
                      <p className="text-sm font-semibold text-foreground italic border-l-2 border-destructive pl-3">
                        "{userData?.alasan_penolakan || "Terdapat ketidaksesuaian pada dokumen yang diunggah."}"
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-sm mb-3 border-b border-border/50 pb-3">
                        <span className="text-muted-foreground font-medium">Pengajuan Toko</span>
                        <span className="font-bold text-foreground bg-secondary/10 px-3 py-1 rounded-md text-secondary flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5" /> {storeData?.nama || storeData?.name || "Memuat..."}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Status Terkini</span>
                        <span className={`font-bold px-3 py-1 rounded-md flex items-center gap-1.5 ${
                          isApproved ? 'text-green-700 bg-green-100' : 'text-orange-600 bg-orange-100'
                        }`}>
                          {isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {isApproved ? "Disetujui" : "Menunggu Review"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  {isApproved ? (
                    <Button className="w-full h-14 rounded-xl font-bold text-base shadow-lg shadow-primary/20" onClick={() => navigate("/owner")}>
                      Masuk ke Dasbor Owner
                    </Button>
                  ) : isRejected ? (
                    <Button 
                      className="w-full h-14 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
                      disabled={isDeleting}
                      onClick={handleDeleteAndReRegister}
                    >
                      <RotateCcw className="h-5 w-5 mr-2" /> {isDeleting ? "Menghapus Akun..." : "Daftar Kembali (Hapus Akun)"}
                    </Button>
                  ) : null}
                  
                  {(!isApproved || isRejected) && (
                    <Button variant="ghost" className="w-full h-12 text-muted-foreground hover:text-foreground" onClick={() => { logout(); navigate("/login"); }}>
                      Keluar dari Sistem
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* KOLOM KANAN: PREVIEW DATA PENDAFTARAN OWNER */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <Card className="border-border/60 shadow-xl rounded-[2rem] overflow-hidden bg-card/50 backdrop-blur-sm mb-6">
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-6 pt-8 px-6 md:px-8">
                <CardTitle className="text-xl flex items-center gap-2">
                  <IdCard className="h-6 w-6 text-primary" /> Rincian Data Kemitraan
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Dokumen dan informasi yang sedang diproses oleh verifikator.
                </p>
              </CardHeader>
              
              <CardContent className="p-6 md:p-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse text-muted-foreground">
                    <Clock className="h-8 w-8 mb-4 opacity-50" />
                    <p>Memuat rincian dokumen...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* BAGIAN 1: INFO PERSONAL & TOKO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 px-3 border-l-4 border-primary">
                          Identitas Pemilik (Owner)
                        </h3>
                        <DataRow icon={User} label="Nama Lengkap" value={userData?.nama} />
                        <DataRow icon={Mail} label="Email Terdaftar" value={userData?.email} />
                        <DataRow icon={Phone} label="Nomor Telepon" value={userData?.kontak} />
                      </div>
                      
                      <div className="space-y-2 mt-6 md:mt-0">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 px-3 border-l-4 border-primary">
                          Profil Toko (Warung)
                        </h3>
                        <DataRow icon={Store} label="Nama Warung" value={storeData?.nama || storeData?.name} />
                        <DataRow icon={Tags} label="Kategori" value={storeData?.kategori_toko || storeData?.kategori} />
                        <DataRow icon={MapPin} label="Koordinat Peta" value={storeData?.latitude ? `${storeData.latitude}, ${storeData.longitude}` : "Tidak disematkan"} />
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <DataRow icon={MapPin} label="Alamat Lengkap Toko" value={storeData?.alamat || userData?.alamat} />
                    </div>

                    {/* BAGIAN 2: GALERI DOKUMEN (KTP & WARUNG) */}
                    <div className="pt-6 border-t border-border/50">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 px-3 border-l-4 border-primary">
                        Dokumen Lampiran (KYC)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* FOTO KTP */}
                        <div className="bg-muted/30 border border-border/80 rounded-2xl p-4">
                          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-muted-foreground" /> KTP Pemilik
                          </p>
                          <div className="w-full bg-secondary/10 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center min-h-[180px] relative group">
                            {userData?.foto_ktp ? (
                              <img
                                src={`http://localhost:5000/uploads/ktp/${userData.foto_ktp}`}
                                alt="Foto KTP Owner"
                                className="w-full h-auto max-h-[250px] object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x500/eee/999?text=Gambar+KTP"; }}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">Tidak tersedia</p>
                            )}
                          </div>
                        </div>

                        {/* FOTO WARUNG */}
                        <div className="bg-muted/30 border border-border/80 rounded-2xl p-4">
                          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" /> Tampak Depan Warung
                          </p>
                          <div className="w-full bg-secondary/10 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center min-h-[180px] relative group">
                            {/* PERBAIKAN: Memanggil foto_warung dari userData yang didapat dari JOIN Backend */}
                            {userData?.foto_warung ? (
                              <img
                                src={`http://localhost:5000/uploads/warung/${userData.foto_warung}`}
                                alt="Foto Warung"
                                className="w-full h-auto max-h-[250px] object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x500/eee/999?text=Gambar+Warung"; }}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">Tidak tersedia</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OwnerStatus;