import { useState, useEffect } from "react";
import { 
  BarChart3, Calendar, Download, Printer, Store, 
  Users, ShoppingCart, DollarSign, Activity, FileText, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/store";
import { toast } from "sonner";

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState<"transaksi" | "toko" | "pengguna">("transaksi");
  const [period, setPeriod] = useState("bulan_ini");
  const [loading, setLoading] = useState(true);

  // State untuk menampung data riil dari Backend MySQL
  const [reportData, setReportData] = useState({
    stats: { omzetTotal: 0, totalTransaksi: 0, tokoAktif: 0, penggunaBaru: 0 },
    transaksi: [] as any[],
    toko: [] as any[],
    pengguna: [] as any[]
  });

  // Ambil data laporan setiap kali filter periode berubah
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/admin/reports?period=${period}`);
        if (res.success && res.data) {
          setReportData(res.data);
        }
      } catch (error) {
        console.error("Gagal memuat laporan", error);
        toast.error("Gagal menyinkronkan laporan dengan server");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [period]);

  const handlePrint = () => {
    toast.success("Mempersiapkan dokumen cetak...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportPDF = () => {
    toast.success("Membuka jendela cetak sistem. Silakan pilih opsi 'Save as PDF' / 'Simpan sebagai PDF' pada tujuan printer.");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getPeriodText = () => {
    switch (period) {
      case "hari_ini": return "Hari Ini";
      case "minggu_ini": return "7 Hari Terakhir";
      case "bulan_ini": return "Bulan Ini";
      case "semua": return "Semua Waktu";
      default: return period;
    }
  };

  // Helper Format Mata Uang & Tanggal
  const formatRupiah = (angka: number) => `Rp ${Number(angka).toLocaleString('id-ID')}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* CSS ISOLASI DOKUMEN CETAK KERTAS */}
      {/* ========================================================= */}
      <style>
        {`
          @media print {
            @page { margin: 0; size: A4; }
            body * { visibility: hidden; }
            html, body { overflow: visible !important; height: auto !important; background-color: white !important; }
            #printable-report, #printable-report * { visibility: visible; }
            #printable-report {
              position: absolute; left: 0; top: 0; width: 100%; padding: 2cm !important;
              background-color: white; color: black;
            }
          }
        `}
      </style>

      {/* ========================================================= */}
      {/* 1. TAMPILAN INTERAKTIF DI LAYAR WEB (style Rame & Responsif) */}
      {/* ========================================================= */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 print:hidden">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl bg-primary/5 p-6 border border-primary/10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" /> Laporan & Analitik Global
            </h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Tinjauan komprehensif aktivitas transaksi, tenant, dan pengguna di ekosistem WarungSync.
            </p>
          </div>
          <div className="relative z-10 flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handlePrint} className="flex-1 md:flex-none bg-background shadow-sm border-primary/20 hover:bg-primary/10">
              <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
            </Button>
          </div>
        </div>

        {/* Kartu Statistik Ringkasan Mini */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Omzet</p>
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-primary mt-2">
                {formatRupiah(reportData.stats.omzetTotal)}
              </h3>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-blue-500/5">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-muted-foreground uppercase">Transaksi Selesai</p>
                <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-foreground mt-2">{reportData.stats.totalTransaksi}</h3>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-orange-500/5">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-muted-foreground uppercase">Toko Aktif</p>
                <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
                  <Store className="h-3.5 w-3.5 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-foreground mt-2">{reportData.stats.tokoAktif}</h3>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-green-500/5">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-muted-foreground uppercase">User Baru</p>
                <div className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-foreground mt-2">{reportData.stats.penggunaBaru}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Panel Kontrol Navigasi & Tabel Layar */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto custom-scrollbar w-full lg:w-auto">
              {["transaksi", "toko", "pengguna"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 lg:flex-none px-6 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all capitalize ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab === "transaksi" ? <FileText className="h-4 w-4" /> : tab === "toko" ? <Store className="h-4 w-4" /> : <Users className="h-4 w-4" />} {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground hidden lg:block" />
              <div className="relative w-full lg:w-48">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select 
                  className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="hari_ini">Hari Ini</option>
                  <option value="minggu_ini">7 Hari Terakhir</option>
                  <option value="bulan_ini">Bulan Ini</option>
                  <option value="semua">Semua Waktu</option>
                </select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Activity className="h-8 w-8 animate-spin mb-4 opacity-50 text-primary" />
                <p className="text-sm font-medium">Sinkronisasi data sistem terpadu...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* 1. LAYAR: TAB TRANSAKSI */}
                {activeTab === "transaksi" && (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">ID / Tanggal</th>
                        <th className="px-6 py-4 font-medium">Toko (Tenant)</th>
                        <th className="px-6 py-4 font-medium">Pelanggan</th>
                        <th className="px-6 py-4 font-medium text-right">Total</th>
                        <th className="px-6 py-4 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reportData.transaksi.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-10 text-muted-foreground font-medium">Belum ada transaksi di periode ini</td></tr>
                      ) : (
                        reportData.transaksi.map((t, i) => (
                          <tr key={i} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4"><div className="font-bold text-foreground">ORD-{t.id}</div><div className="text-xs text-muted-foreground">{formatDate(t.tanggal_dibuat)}</div></td>
                            <td className="px-6 py-4 font-medium">{t.nama_toko}</td>
                            <td className="px-6 py-4 text-muted-foreground">{t.nama_pelanggan}</td>
                            <td className="px-6 py-4 font-bold text-right text-primary">{formatRupiah(t.total_harga)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary capitalize">{t.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* 2. LAYAR: TAB PERFORMA TOKO */}
                {activeTab === "toko" && (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">Nama Mitra Toko</th>
                        <th className="px-6 py-4 font-medium">Nama Pemilik (Owner)</th>
                        <th className="px-6 py-4 font-medium text-center">Total Pesanan</th>
                        <th className="px-6 py-4 font-medium text-right">Omzet Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reportData.toko.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-muted-foreground font-medium">Belum ada data tenant terdaftar</td></tr>
                      ) : (
                        reportData.toko.map((t, i) => (
                          <tr key={i} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-foreground">{t.nama}</td>
                            <td className="px-6 py-4 text-muted-foreground">{t.nama_owner}</td>
                            <td className="px-6 py-4 text-center font-semibold">{t.total_pesanan} Trx</td>
                            <td className="px-6 py-4 font-bold text-right text-green-600">{formatRupiah(t.omzet)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* 3. LAYAR: TAB DATA PENGGUNA */}
                {activeTab === "pengguna" && (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">Nama Pengguna</th>
                        <th className="px-6 py-4 font-medium">Hak Akses Peran</th>
                        <th className="px-6 py-4 font-medium">Waktu Registrasi</th>
                        <th className="px-6 py-4 font-medium text-center">Status Akun</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reportData.pengguna.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-muted-foreground font-medium">Tidak ada registrasi di periode ini</td></tr>
                      ) : (
                        reportData.pengguna.map((u, i) => (
                          <tr key={i} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">{u.nama}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${u.peran === 'admin' ? 'bg-red-500/10 text-red-600' : u.peran === 'owner' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                {u.peran}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{formatDate(u.tanggal_dibuat)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${u.status === 'nonaktif' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                                {u.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 2. TAMPILAN RESMI KERTAS (Hanya Muncul Saat di-Print / Save PDF) */}
      {/* ========================================================= */}
      <div id="printable-report" className="hidden print:block">
        {/* Kop Surat Resmi */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '16px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0', fontFamily: 'sans-serif' }}>
            WarungSync System
          </h1>
          <p style={{ fontSize: '13px', margin: '4px 0', color: '#333', fontFamily: 'sans-serif' }}>
            Sistem Informasi POS & Manajemen Toko Sembako Online Terpadu
          </p>
          <div style={{ marginTop: '16px', fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: '15px', margin: '0', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              LAPORAN DOKUMEN: <span style={{ textDecoration: 'underline' }}>{activeTab} GLOBAL</span>
            </p>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#555' }}>
              Filter Periode: <strong>{getPeriodText()}</strong> | Diunduh Pada: {new Date().toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Ringkasan Laporan Finansial & Operasional */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', border: '1px solid #000', padding: '14px', borderRadius: '4px', fontFamily: 'sans-serif' }}>
          <div><p style={{ fontSize: '11px', margin: '0 0 4px 0', color: '#555' }}>TOTAL OMZET BRUTO</p><h3 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>{formatRupiah(reportData.stats.omzetTotal)}</h3></div>
          <div><p style={{ fontSize: '11px', margin: '0 0 4px 0', color: '#555' }}>TOTAL TRANSAKSI SUKSES</p><h3 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>{reportData.stats.totalTransaksi} Pesanan</h3></div>
          <div><p style={{ fontSize: '11px', margin: '0 0 4px 0', color: '#555' }}>MITRA TENANT AKTIF</p><h3 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>{reportData.stats.tokoAktif} Warung</h3></div>
          <div><p style={{ fontSize: '11px', margin: '0 0 4px 0', color: '#555' }}>PERTUMBUHAN USER BARU</p><h3 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>{reportData.stats.penggunaBaru} Akun</h3></div>
        </div>

        {/* Tabel Cetak Dokumen Formal */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'sans-serif' }}>
          <thead>
            <tr style={{ backgroundColor: '#eaeaea' }}>
              {activeTab === "transaksi" && (
                <>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>ID Transaksi</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Waktu Pemesanan</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Nama Toko</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Nama Pelanggan</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total Pembayaran</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Status</th>
                </>
              )}
              {activeTab === "toko" && (
                <>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Nama Toko Mitra</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Pemilik Sah (Owner)</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Pesanan Sukses</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total Akumulasi Omzet</th>
                </>
              )}
              {activeTab === "pengguna" && (
                <>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Nama Lengkap</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Otoritas Peran</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Tanggal Terdaftar</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Status Operasional</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {activeTab === "transaksi" && reportData.transaksi.map((t, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>ORD-{t.id}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{formatDate(t.tanggal_dibuat)}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama_toko}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama_pelanggan}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(t.total_harga)}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', textTransform: 'uppercase' }}>{t.status}</td>
              </tr>
            ))}
            {activeTab === "toko" && reportData.toko.map((t, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{t.nama}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama_owner}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{t.total_pesanan} Trx</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(t.omzet)}</td>
              </tr>
            ))}
            {activeTab === "pengguna" && reportData.pengguna.map((u, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{u.nama}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textTransform: 'capitalize' }}>{u.peran}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{formatDate(u.tanggal_dibuat)}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', textTransform: 'uppercase' }}>{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Slot Tanda Tangan Validasi Skripsi/Laporan */}
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <p style={{ margin: '0 0 65px 0', fontSize: '13px' }}>Banjarmasin, {new Date().toLocaleDateString('id-ID')}</p>
            <p style={{ margin: '0', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '6px', fontSize: '13px', textTransform: 'uppercase' }}>
              Super Admin Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminReportsPage;