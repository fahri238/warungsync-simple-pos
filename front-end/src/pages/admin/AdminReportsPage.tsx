import { useState, useEffect } from "react";
import { 
  BarChart3, Calendar, Download, Printer, TrendingUp, Store, 
  Users, ShoppingCart, DollarSign, Activity, FileText, Filter, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/store";
import { toast } from "sonner";

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState<"transaksi" | "toko" | "pengguna">("transaksi");
  const [period, setPeriod] = useState("bulan_ini");
  const [loading, setLoading] = useState(true);

  // State untuk menampung data dari Backend MySQL
  const [reportData, setReportData] = useState({
    stats: { omzetTotal: 0, totalTransaksi: 0, tokoAktif: 0, penggunaBaru: 0 },
    transaksi: [] as any[],
    toko: [] as any[],
    pengguna: [] as any[]
  });

  // Tembak API setiap kali filter periode berubah
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

  const getPeriodText = () => {
    switch (period) {
      case "hari_ini": return "Hari Ini";
      case "minggu_ini": return "7 Hari Terakhir";
      case "bulan_ini": return "Bulan Ini";
      case "semua": return "Semua Waktu";
      default: return period;
    }
  };

  // Helper Format Waktu & Uang
  const formatRupiah = (angka: number) => `Rp ${Number(angka).toLocaleString('id-ID')}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* CSS ISOLASI CETAK */}
      <style>
        {`
          @media print {
            @page { margin: 0; }
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

      {/* ======================= TAMPILAN LAYAR ======================= */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 print:hidden">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl bg-primary/5 p-6 border border-primary/10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" /> Laporan & Analitik Global
            </h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Tinjauan komprehensif aktivitas transaksi, tenant, dan pengguna.
            </p>
          </div>
          <div className="relative z-10 flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handlePrint} className="flex-1 md:flex-none bg-background shadow-sm border-primary/20 hover:bg-primary/10">
              <Printer className="mr-2 h-4 w-4" /> Cetak Dokumen
            </Button>
          </div>
        </div>

        {/* Mini Stats Grid */}
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

        {/* Filter & Tabel Data */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="p-4 md:px-6 md:py-4 border-b border-border/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto custom-scrollbar w-full lg:w-auto">
              {["transaksi", "toko", "pengguna"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 lg:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all capitalize ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
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
                  className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                <p>Menarik data laporan...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === "transaksi" && (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/80">
                      <tr>
                        <th className="px-6 py-4 font-medium">ID / Tanggal</th>
                        <th className="px-6 py-4 font-medium">Toko</th>
                        <th className="px-6 py-4 font-medium">Pelanggan</th>
                        <th className="px-6 py-4 font-medium text-right">Total</th>
                        <th className="px-6 py-4 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reportData.transaksi.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada transaksi di periode ini</td></tr>
                      ) : (
                        reportData.transaksi.map((t, i) => (
                          <tr key={i} className="hover:bg-muted/10">
                            <td className="px-6 py-4"><div className="font-bold">ORD-{t.id}</div><div className="text-xs text-muted-foreground">{formatDate(t.tanggal_dibuat)}</div></td>
                            <td className="px-6 py-4">{t.nama_toko}</td>
                            <td className="px-6 py-4 text-muted-foreground">{t.nama_pelanggan}</td>
                            <td className="px-6 py-4 font-bold text-right text-primary">{formatRupiah(t.total_harga)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary capitalize">{t.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* Konten tabel layar untuk Toko & Pengguna (Disembunyikan agar lebih efisien) */}
                {activeTab !== "transaksi" && (
                  <div className="p-12 text-center flex flex-col items-center text-muted-foreground border-t border-border/50">
                    <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                    <p>Tabel {activeTab} dioptimalkan untuk tampilan cetak dokumen.</p>
                    <Button variant="link" onClick={handlePrint} className="mt-2">Lihat di Kertas Cetak</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================= TAMPILAN KERTAS ======================= */}
      <div id="printable-report" className="hidden print:block">
        <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '16px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0' }}>WarungSync System</h1>
          <p style={{ fontSize: '14px', margin: '4px 0', color: '#333' }}>Sistem Manajemen POS & Toko Online Terpadu</p>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>LAPORAN KINERJA <span style={{ textTransform: 'uppercase' }}>{activeTab}</span></p>
            <p style={{ fontSize: '14px', margin: '4px 0 0 0', color: '#555' }}>Periode: <strong>{getPeriodText()}</strong></p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', border: '1px solid #ccc', padding: '16px', borderRadius: '4px' }}>
          <div><p style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#666' }}>TOTAL OMZET</p><h3 style={{ fontSize: '18px', margin: '0', fontWeight: 'bold' }}>{formatRupiah(reportData.stats.omzetTotal)}</h3></div>
          <div><p style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#666' }}>TRANSAKSI SELESAI</p><h3 style={{ fontSize: '18px', margin: '0', fontWeight: 'bold' }}>{reportData.stats.totalTransaksi}</h3></div>
          <div><p style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#666' }}>TOKO AKTIF</p><h3 style={{ fontSize: '18px', margin: '0', fontWeight: 'bold' }}>{reportData.stats.tokoAktif}</h3></div>
          <div><p style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#666' }}>PENGGUNA BARU</p><h3 style={{ fontSize: '18px', margin: '0', fontWeight: 'bold' }}>{reportData.stats.penggunaBaru}</h3></div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'sans-serif' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {activeTab === "transaksi" && (
                <><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>ID Transaksi</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Tanggal</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Toko</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Pelanggan</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Status</th></>
              )}
              {activeTab === "toko" && (
                <><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Nama Toko</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Owner</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total Pesanan Selesai</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Omzet Toko</th></>
              )}
              {activeTab === "pengguna" && (
                <><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Nama Pengguna</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Peran</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Tanggal Bergabung</th><th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Status</th></>
              )}
            </tr>
          </thead>
          <tbody>
            {activeTab === "transaksi" && reportData.transaksi.map((t, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>ORD-{t.id}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{formatDate(t.tanggal_dibuat)}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama_toko}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama_pelanggan}</td><td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatRupiah(t.total_harga)}</td><td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', textTransform: 'capitalize' }}>{t.status}</td>
              </tr>
            ))}
            {activeTab === "toko" && reportData.toko.map((t, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{t.nama_owner}</td><td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{t.total_pesanan}</td><td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatRupiah(t.omzet)}</td>
              </tr>
            ))}
            {activeTab === "pengguna" && reportData.pengguna.map((u, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{u.nama}</td><td style={{ border: '1px solid #000', padding: '8px', textTransform: 'capitalize' }}>{u.peran}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{formatDate(u.tanggal_dibuat)}</td><td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', textTransform: 'capitalize' }}>{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <p style={{ margin: '0 0 60px 0', fontSize: '14px' }}>Banjarmasin, {new Date().toLocaleDateString('id-ID')}</p>
            <p style={{ margin: '0', fontWeight: 'bold', borderTop: '1px solid black', paddingTop: '8px' }}>Super Admin</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminReportsPage;