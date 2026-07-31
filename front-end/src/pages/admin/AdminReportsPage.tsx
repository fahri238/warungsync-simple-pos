import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Printer,
  Store,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  FileText,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/store";
import { toast } from "sonner";

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState<"transaksi" | "toko" | "pengguna">(
    "transaksi",
  );
  const [period, setPeriod] = useState("bulan_ini");
  const [loading, setLoading] = useState(true);

  const [reportData, setReportData] = useState({
    stats: {
      omzetTotal: 0,
      komisiTotal: 0,
      totalTransaksi: 0,
      tokoAktif: 0,
      penggunaBaru: 0,
    },
    transaksi: [] as any[],
    toko: [] as any[],
    pengguna: [] as any[],
  });

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

  const getPeriodText = () => {
    switch (period) {
      case "hari_ini":
        return "Hari Ini";
      case "minggu_ini":
        return "7 Hari Terakhir";
      case "bulan_ini":
        return "Bulan Ini";
      case "semua":
        return "Semua Waktu";
      default:
        return period;
    }
  };

  const formatRupiah = (angka: number) =>
    `Rp ${Number(angka).toLocaleString("id-ID")}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // PERBAIKAN: Fungsi Handle Print terpisah untuk 4 jenis dokumen (Global, Transaksi, Toko, Pengguna)
  // Cara ini menghilangkan bug CSS absolute agar halaman bisa terpotong sempurna (Pagination)
  const handlePrintReport = (type: string, title: string) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const printDate = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const summaryHtml = `
      <div class="summary-box">
        <div class="summary-item green">
          <div class="summary-label">PENDAPATAN SISTEM (5%)</div>
          <h3 class="summary-value">${formatRupiah(reportData.stats.komisiTotal)}</h3>
        </div>
        <div class="summary-item">
          <div class="summary-label">TOTAL OMZET BRUTO</div>
          <h3 class="summary-value">${formatRupiah(reportData.stats.omzetTotal)}</h3>
        </div>
        <div class="summary-item">
          <div class="summary-label">TOTAL TRANSAKSI SUKSES</div>
          <h3 class="summary-value">${reportData.stats.totalTransaksi} Pesanan</h3>
        </div>
        <div class="summary-item">
          <div class="summary-label">MITRA TENANT AKTIF</div>
          <h3 class="summary-value">${reportData.stats.tokoAktif} Warung</h3>
        </div>
      </div>
    `;

    const transaksiTable = `
      <div class="section-title">Data Transaksi</div>
      <table>
        <thead>
          <tr>
            <th>ID Transaksi</th>
            <th>Waktu Pemesanan</th>
            <th>Nama Toko</th>
            <th class="text-right">Total Transaksi</th>
            <th class="text-right color-green">Komisi Sistem (5%)</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.transaksi
            .map(
              (t) => `
            <tr>
              <td class="font-bold">ORD-${t.id}</td>
              <td>${formatDate(t.tanggal_dibuat)}</td>
              <td>${t.nama_toko}</td>
              <td class="text-right">${formatRupiah(t.total_harga)}</td>
              <td class="text-right font-bold color-green">${formatRupiah(t.komisi_sistem || 0)}</td>
              <td class="text-center text-uppercase">${t.status}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    const tokoTable = `
      <div class="section-title">Performa Mitra Toko</div>
      <table>
        <thead>
          <tr>
            <th>Nama Toko Mitra</th>
            <th>Pemilik Sah (Owner)</th>
            <th class="text-center">Pesanan Sukses</th>
            <th class="text-right">Total Omzet</th>
            <th class="text-right color-green">Total Komisi</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.toko
            .map(
              (t) => `
            <tr>
              <td class="font-bold">${t.nama}</td>
              <td>${t.nama_owner}</td>
              <td class="text-center">${t.total_pesanan} Trx</td>
              <td class="text-right">${formatRupiah(t.omzet)}</td>
              <td class="text-right font-bold color-green">${formatRupiah(t.total_komisi || 0)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    const penggunaTable = `
      <div class="section-title">Data Pengguna Sistem</div>
      <table>
        <thead>
          <tr>
            <th>Nama Lengkap</th>
            <th>Otoritas Peran</th>
            <th>Tanggal Terdaftar</th>
            <th class="text-center">Status Operasional</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.pengguna
            .map(
              (u) => `
            <tr>
              <td class="font-bold">${u.nama}</td>
              <td style="text-transform: capitalize;">${u.peran}</td>
              <td>${formatDate(u.tanggal_dibuat)}</td>
              <td class="text-center text-uppercase">${u.status}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    let contentHtml = "";
    if (type === "global") {
      contentHtml = summaryHtml + transaksiTable + tokoTable + penggunaTable;
    } else if (type === "transaksi") {
      contentHtml = summaryHtml + transaksiTable;
    } else if (type === "toko") {
      contentHtml = summaryHtml + tokoTable;
    } else if (type === "pengguna") {
      contentHtml = summaryHtml + penggunaTable;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          
          html { margin: 0; padding: 0; height: 100%; background: #fff; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            color: #333; 
            margin: 0;
            padding: 1.5cm 2cm; 
            font-size: 11px; 
            box-sizing: border-box; 
            
            /* TRIK UTAMA: Memaksa kertas minimal setinggi A4 fisik (296mm) */
            min-height: 296mm; 
            display: flex; 
            flex-direction: column; 
          }
          
          /* Konten otomatis mengisi sisa ruang kertas dan mendorong TTD ke bawah */
          .content-wrapper { flex: 1 1 auto; }
          
          /* Posisi TTD pasti tertahan di dasar kertas berkat flex auto */
          .signature-wrapper { 
            margin-top: auto; 
            padding-top: 40px;
            display: flex; 
            justify-content: flex-end; 
            page-break-inside: avoid;
          }

          .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; margin: 0 0 5px 0; color: #2c3e50; letter-spacing: 1px; text-transform: uppercase; }
          .subtitle { font-size: 13px; color: #7f8c8d; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          
          .summary-box { display: flex; gap: 15px; margin-bottom: 24px; }
          .summary-item { border: 1px solid #000; padding: 12px; border-radius: 4px; text-align: left; flex: 1; }
          .summary-item.green { background-color: #f0fdf4; border-color: #16a34a; }
          .summary-label { font-size: 10px; color: #555; text-transform: uppercase; font-weight: bold; margin-bottom: 6px; }
          .summary-item.green .summary-label { color: #166534; }
          .summary-value { font-size: 16px; font-weight: bold; color: #000; margin: 0; }
          .summary-item.green .summary-value { color: #16a34a; font-size: 18px; }
          
          .section-title { font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          th, td { border: 1px solid #000; padding: 8px; }
          th { background-color: #eaeaea; font-weight: bold; text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .text-uppercase { text-transform: uppercase; }
          .color-green { color: #166534; }
        </style>
      </head>
      <body>
        
        <div class="content-wrapper">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-bottom: 30px;">
            <span>${printDate}</span>
            <span style="font-weight: bold;">WarungSync — POS & Toko Online</span>
          </div>

          <div class="header">
            <h1 class="title">WarungSync System</h1>
            <p class="subtitle">Sistem Informasi POS & Manajemen Toko Sembako Online Terpadu</p>
          </div>
          <div class="meta">
            <div><strong>Laporan Dokumen:</strong> <span style="text-decoration: underline; text-transform: uppercase; font-weight: bold;">${title}</span></div>
            <div><strong>Filter Periode:</strong> ${getPeriodText()}</div>
          </div>
          
          ${contentHtml}
        </div>

        <div class="signature-wrapper">
          <div style="text-align: center; width: 220px;">
            <p style="margin: 0 0 65px 0; font-size: 12px;">Banjarmasin, ${new Date().toLocaleDateString("id-ID")}</p>
            <p style="margin: 0; font-weight: bold; border-top: 1px solid #000; padding-top: 6px; font-size: 12px; text-transform: uppercase;">
              Super Admin Platform
            </p>
          </div>
        </div>

        <script>
          window.onload = () => { setTimeout(() => window.print(), 500); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Banner Header - Cetak Global */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl bg-primary/5 p-6 border border-primary/10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Laporan & Analitik
            Global
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Tinjauan komprehensif aktivitas transaksi, tenant, dan pengguna di
            ekosistem WarungSync.
          </p>
        </div>
        <div className="relative z-10 flex gap-2 w-full md:w-auto">
          <Button
            variant="default"
            onClick={() => handlePrintReport("global", "Laporan Global Keseluruhan")}
            className="flex-1 md:flex-none shadow-sm gap-2"
          >
            <Printer className="h-4 w-4" /> Cetak Laporan Global
          </Button>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card className="border-green-500/30 shadow-md bg-green-500/10 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-green-500/20 blur-xl pointer-events-none"></div>
          <CardContent className="p-4 flex flex-col gap-1 relative z-10">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-green-700 uppercase">
                Pendapatan Sistem
              </p>
              <div className="h-6 w-6 rounded-md bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-green-700" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-green-700 mt-2">
              {formatRupiah(reportData.stats.komisiTotal)}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-primary/5">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Total Omzet Tenant
              </p>
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
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Transaksi Selesai
              </p>
              <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">
              {reportData.stats.totalTransaksi}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-orange-500/5">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Toko Aktif
              </p>
              <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
                <Store className="h-3.5 w-3.5 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">
              {reportData.stats.tokoAktif}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-green-500/5">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                User Baru
              </p>
              <div className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mt-2">
              {reportData.stats.penggunaBaru}
            </h3>
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
                {tab === "transaksi" ? (
                  <FileText className="h-4 w-4" />
                ) : tab === "toko" ? (
                  <Store className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}{" "}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* TAMBAHAN: Tombol cetak untuk tab spesifik */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintReport(activeTab, `Laporan ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)}
              className="w-full sm:w-auto gap-2"
            >
              <Printer className="h-4 w-4" /> Cetak Tabel Ini
            </Button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground hidden lg:block" />
              <div className="relative w-full sm:w-48">
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
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Activity className="h-8 w-8 animate-spin mb-4 opacity-50 text-primary" />
              <p className="text-sm font-medium">
                Sinkronisasi data sistem terpadu...
              </p>
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
                      <th className="px-6 py-4 font-medium text-right">
                        Total Transaksi
                      </th>
                      <th className="px-6 py-4 font-medium text-right text-green-600">
                        Komisi Sistem (5%)
                      </th>
                      <th className="px-6 py-4 font-medium text-center">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {reportData.transaksi.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-10 text-muted-foreground font-medium"
                        >
                          Belum ada transaksi di periode ini
                        </td>
                      </tr>
                    ) : (
                      reportData.transaksi.map((t, i) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">
                              ORD-{t.id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(t.tanggal_dibuat)}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {t.nama_toko}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {t.nama_pelanggan}
                          </td>
                          <td className="px-6 py-4 font-bold text-right text-foreground">
                            {formatRupiah(t.total_harga)}
                          </td>
                          <td className="px-6 py-4 font-bold text-right text-green-600 bg-green-500/5">
                            {formatRupiah(t.komisi_sistem || 0)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary capitalize">
                              {t.status}
                            </span>
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
                      <th className="px-6 py-4 font-medium">
                        Nama Mitra Toko
                      </th>
                      <th className="px-6 py-4 font-medium">
                        Nama Pemilik (Owner)
                      </th>
                      <th className="px-6 py-4 font-medium text-center">
                        Total Pesanan
                      </th>
                      <th className="px-6 py-4 font-medium text-right">
                        Omzet Pendapatan
                      </th>
                      <th className="px-6 py-4 font-medium text-right text-green-600">
                        Total Komisi Sistem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {reportData.toko.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-10 text-muted-foreground font-medium"
                        >
                          Belum ada data tenant terdaftar
                        </td>
                      </tr>
                    ) : (
                      reportData.toko.map((t, i) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-foreground">
                            {t.nama}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {t.nama_owner}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold">
                            {t.total_pesanan} Trx
                          </td>
                          <td className="px-6 py-4 font-bold text-right text-primary">
                            {formatRupiah(t.omzet)}
                          </td>
                          <td className="px-6 py-4 font-black text-right text-green-600 bg-green-500/5">
                            {formatRupiah(t.total_komisi || 0)}
                          </td>
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
                      <th className="px-6 py-4 font-medium">
                        Hak Akses Peran
                      </th>
                      <th className="px-6 py-4 font-medium">
                        Waktu Registrasi
                      </th>
                      <th className="px-6 py-4 font-medium text-center">
                        Status Akun
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {reportData.pengguna.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-10 text-muted-foreground font-medium"
                        >
                          Tidak ada registrasi di periode ini
                        </td>
                      </tr>
                    ) : (
                      reportData.pengguna.map((u, i) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {u.nama}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${u.peran === "admin" ? "bg-red-500/10 text-red-600" : u.peran === "owner" ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"}`}
                            >
                              {u.peran}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(u.tanggal_dibuat)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${u.status === "nonaktif" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}
                            >
                              {u.status === "nonaktif" ? "Nonaktif" : "Aktif"}
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
  );
};

export default AdminReportsPage;