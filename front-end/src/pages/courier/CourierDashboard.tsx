import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession } from "@/lib/store";
import type { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// PERBAIKAN: Menambahkan import Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Truck, MapPin, Package, Phone, CheckCircle, Store, ReceiptText, ChevronRight, Printer } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, updateOrderStatus } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { completeDelivery } from "@/services/deliveryService";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Sedang Diantar", completed: "Selesai"
};

const CourierDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!session || ((session.role as string) !== "courier" && (session.role as string) !== "kurir")) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    fetchOrders()
      .then((rows) => {
        const mine = rows.filter((o: any) => 
          Number(o.courierId) === Number(session.id) && 
          (o.fulfillment === "delivery" || o.fulfillment === "kurir")
        );
        setOrders(mine);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat data kurir");
      })
      .finally(() => setLoadingOrders(false));
  }, [session]);

  const activeOrders = useMemo(
    () => orders.filter((o) => 
      ["delivering", "diantar", "processing", "diproses", "ready", "siap_ambil"].includes(o.status as string)
    ),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => 
      ["completed", "selesai"].includes(o.status as string)
    ),
    [orders]
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCompleteDelivery = async (order: Order) => {
    try {
      if ((order as any).deliveryId) {
        await completeDelivery((order as any).deliveryId);
      } else {
        await updateOrderStatus(order.id, { status: "completed" });
      }
      
      const rows = await fetchOrders();
      const mine = rows.filter((o: any) => 
        Number(o.courierId) === Number(session.id) && 
        (o.fulfillment === "delivery" || o.fulfillment === "kurir")
      );
      setOrders(mine);
      toast.success("Pengiriman berhasil diselesaikan!");
    } catch (error: any) {
      toast.error(error?.message || "Gagal memperbarui status pengiriman");
    }
  };

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === 'number') return order.total;
    const itemsTotal = order.items?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const handlePrintSuratJalan = (order: Order) => {
    const orderTotal = getOrderTotal(order);
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map(i => `
      <div class="row" style="border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px;">
        <span class="item-name">${i.product?.name || 'Produk'}</span>
        <span class="bold">x${i.quantity}</span>
      </div>
    `).join('');

    const d = new Date();
    const formattedDate = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
      " • " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const alamatTujuan = (order as any).deliveryAddress || order.customerAddress || 'Alamat tidak dicantumkan';
    const namaToko = (order as any).storeName || (session as any)?.storeName || 'TOKO MITRA WARUNGSYNC';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Jalan #${order.id.toString().slice(-6)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 15px; color: #000; box-sizing: border-box; }
          @media screen { body { background-color: white; border: 1px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; min-height: 200px; } html { background-color: #f0f0f0; } }
          .center { text-align: center; } .bold { font-weight: bold; } .divider { border-top: 2px dashed #000; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; } .item-name { flex: 1; padding-right: 15px; word-break: break-word; }
          .title { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase;}
          .box { border: 1px solid #000; padding: 8px; margin-top: 10px; border-radius: 4px;}
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${namaToko.toUpperCase()}</div>
          <div style="font-weight: bold; font-size: 14px; margin-top: 5px;">SURAT JALAN PENGIRIMAN</div>
          <div style="color: #333; font-size: 10px; margin-top: 4px;">Dicetak: ${formattedDate}</div>
        </div>
        <div class="divider"></div>
        <div style="margin-bottom: 8px;">
          <div style="font-size: 10px; color: #555;">PENERIMA:</div>
          <div class="bold" style="font-size: 14px;">${order.customerName || 'Pelanggan'}</div>
          <div class="bold" style="font-size: 14px; margin-top: 2px;">📞 ${order.customerPhone || '-'}</div>
        </div>
        <div class="box">
          <div style="font-size: 10px; color: #555; margin-bottom: 4px;">ALAMAT PENGIRIMAN:</div>
          <div style="font-size: 13px; line-height: 1.4;">${alamatTujuan}</div>
        </div>
        <div class="divider"></div>
        <div style="font-size: 10px; color: #555; margin-bottom: 6px;">DAFTAR BARANG:</div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row bold" style="font-size: 14px;">
          <span>Tagihan COD:</span>
          <span>Rp ${orderTotal.toLocaleString("id-ID")}</span>
        </div>
        <div class="center" style="margin-top: 20px; font-size: 10px;">
          <div>Kurir: <span class="bold">${session?.name || 'Kurir'}</span></div>
          <div style="margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; display: inline-block; width: 80%;">Tanda Tangan Penerima</div>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // FITUR BARU: Cetak Laporan Selesai (Rekap Setoran COD)
  const handlePrintCompleted = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return toast.error("Pop-up diblokir browser");

    const dateStr = new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });
    const totalSetoran = completedOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);

    const tableContent = `
      <table>
        <thead>
          <tr>
            <th>Tanggal Selesai</th>
            <th>Pelanggan</th>
            <th>Alamat Tujuan</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${completedOrders.map(o => `
            <tr>
              <td>${new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
              <td><b>${o.customerName}</b><br><small>${o.customerPhone || '-'}</small></td>
              <td>${(o as any).deliveryAddress || o.customerAddress || '-'}</td>
              <td class="right">Rp ${getOrderTotal(o).toLocaleString("id-ID")}</td>
            </tr>
          `).join('')}
          <tr class="highlight bold">
            <td colspan="3">TOTAL UANG SETORAN COD</td>
            <td class="right">Rp ${totalSetoran.toLocaleString("id-ID")}</td>
          </tr>
        </tbody>
      </table>`;

    printWindow.document.write(`
      <html>
      <head>
        <title>Rekap Pengiriman - ${session?.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #222; padding-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; color: #111; text-transform: uppercase; }
          .subtitle { font-size: 14px; color: #555; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background-color: #f4f4f5; text-align: left; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
          td { padding: 10px; border: 1px solid #ddd; }
          .right { text-align: right; } .highlight { background-color: #f8fafc; } .bold { font-weight: bold; }
          .footer { margin-top: 40px; font-size: 12px; color: #777; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Pengiriman Selesai</h1>
          <div class="subtitle">Nama Kurir: <b>${session?.name || 'Kurir'}</b></div>
        </div>
        ${tableContent}
        <div class="footer">Dicetak otomatis dari WarungSync pada ${dateStr}</div>
        <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!session || ((session.role as string) !== "courier" && (session.role as string) !== "kurir")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4">
        <Card className="w-full max-w-sm text-center shadow-lg border-0 rounded-3xl">
          <CardContent className="py-10">
            <div className="mx-auto h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-inner mb-6">
              <Truck className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="mb-6 text-muted-foreground text-sm">Sesi kurir Anda tidak ditemukan atau sudah kadaluarsa.</p>
            <Button asChild className="w-full rounded-xl h-12 text-base"><Link to="/login">Masuk Kembali</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-secondary text-secondary-foreground pt-8 md:pt-6 pb-20 md:pb-16 px-5 md:px-8 rounded-b-[2rem] relative z-0">
        <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-2 md:mb-1">
            <div>
              <p className="text-secondary-foreground/70 text-xs md:text-sm font-medium tracking-wide mb-1 uppercase">Kurir Aktif</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Halo, {session.name.split(' ')[0]} 👋</h1>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white rounded-full h-10 w-10 md:h-12 md:w-12" onClick={handleLogout}>
              <LogOut className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </div>
          <p className="text-secondary-foreground/90 text-sm md:text-base max-w-md">
            {activeOrders.length > 0 
              ? `Ada ${activeOrders.length} paket yang menunggu untuk diantar.` 
              : "Belum ada paket yang ditugaskan untuk Anda."}
          </p>
        </div>
      </div>

      <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 md:px-8 -mt-10 md:-mt-8 relative z-10 space-y-6 md:space-y-8">
        
        {/* FLOATING STATS */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-md shadow-black/5 border border-border flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6 md:h-7 md:w-7 text-accent" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-foreground leading-none">{activeOrders.length}</p>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Antrian</p>
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-md shadow-black/5 border border-border flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-success/15 flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-success" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-foreground leading-none">{completedOrders.length}</p>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Selesai</p>
            </div>
          </div>
        </div>

        {/* MENGGUNAKAN TABS UNTUK MEMISAHKAN ANTRIAN DAN SELESAI */}
        <Tabs defaultValue="active" className="w-full space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h2 className="text-lg md:text-xl font-bold text-foreground">Daftar Kiriman</h2>
             <TabsList className="bg-muted/50 p-1 rounded-xl">
               <TabsTrigger value="active" className="rounded-lg text-sm font-semibold">Antrian ({activeOrders.length})</TabsTrigger>
               <TabsTrigger value="completed" className="rounded-lg text-sm font-semibold">Selesai ({completedOrders.length})</TabsTrigger>
             </TabsList>
          </div>

          {/* TAB: ANTRIAN PENGIRIMAN */}
          <TabsContent value="active" className="focus-visible:outline-none">
            {loadingOrders ? (
              <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">Mensinkronkan data...</div>
            ) : activeOrders.length === 0 ? (
              <div className="bg-card rounded-3xl p-10 md:p-16 text-center shadow-sm border border-border/50 flex flex-col items-center">
                <div className="h-20 w-20 md:h-24 md:w-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/40" />
                </div>
                <p className="font-bold text-foreground text-lg md:text-xl">Semua Selesai!</p>
                <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-sm mx-auto">Anda bisa beristirahat sekarang. Tidak ada pengiriman yang tertunda.</p>
              </div>
            ) : (
              <div className="space-y-5 md:space-y-6 items-start">
                {activeOrders.map(o => {
                  const tagihan = getOrderTotal(o);
                  const alamatTujuan = (o as any).deliveryAddress || o.customerAddress || 'Alamat tidak lengkap';
                  
                  return (
                    <Card key={o.id} className="overflow-hidden border-border/60 shadow-sm rounded-[1.5rem] hover:shadow-md transition-all">
                      <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 md:p-5 flex justify-between items-center border-b border-border/50">
                        <div>
                          <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider">ID: {o.id.toString().slice(-6).toUpperCase()}</span>
                          <p className="font-extrabold text-foreground text-base md:text-lg leading-tight mt-0.5">{o.customerName}</p>
                        </div>
                        <span className="bg-white px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shadow-sm border border-border/50 text-foreground">
                          Sedang Diantar
                        </span>
                      </div>

                      <CardContent className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="flex flex-col gap-5 md:gap-6">
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center mt-1">
                              <div className="h-3 w-3 md:h-3.5 md:w-3.5 rounded-full bg-secondary ring-4 ring-secondary/20 z-10" />
                              <div className="w-0.5 h-full min-h-[3rem] bg-border -my-1" />
                              <div className="h-3 w-3 md:h-3.5 md:w-3.5 rounded-full bg-primary ring-4 ring-primary/20 z-10" />
                            </div>
                            <div className="flex-1 space-y-4 md:space-y-6">
                              <div>
                                <p className="text-[11px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ambil di</p>
                                <div className="flex items-center gap-1.5 text-sm md:text-base font-semibold text-foreground">
                                  <Store className="h-4 w-4 md:h-5 md:w-5 text-secondary" /> {(o as any).storeName || (session as any)?.storeName || "Toko Mitra"}
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Antar ke</p>
                                <div className="flex items-start gap-1.5 text-sm md:text-base font-semibold text-foreground">
                                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0 mt-0.5" />
                                  <span className="leading-snug">{alamatTujuan}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pl-7 md:pl-8">
                            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" /> Rincian Barang
                            </p>
                            <div className="bg-muted/30 rounded-xl p-3 md:p-4 border border-border/50 max-h-[140px] overflow-y-auto custom-scrollbar space-y-2.5">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-3 border-b border-border/50 last:border-0 pb-2 last:pb-0">
                                  <span className="text-sm font-medium text-foreground leading-snug">
                                    {item.product.name}
                                  </span>
                                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md shrink-0">
                                    {item.quantity}x
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between space-y-5">
                          <div>
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                              <div className="bg-muted/50 rounded-xl p-3 md:p-4">
                                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase mb-1">Telepon</p>
                                <a href={`tel:${o.customerPhone}`} className="flex items-center gap-1.5 text-sm md:text-base font-bold text-secondary hover:text-primary transition-colors">
                                  <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" /> {o.customerPhone || '-'}
                                </a>
                              </div>
                              <div className="bg-muted/50 rounded-xl p-3 md:p-4">
                                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase mb-1">Total Item</p>
                                <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-foreground">
                                  <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" /> {o.items.reduce((sum, i) => sum + i.quantity, 0)} Barang
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 md:mt-5 bg-orange-100 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="bg-orange-200 p-1.5 md:p-2 rounded-md">
                                  <ReceiptText className="h-4 w-4 md:h-5 md:w-5 text-orange-700" />
                                </div>
                                <span className="text-xs md:text-sm font-bold text-orange-800 uppercase tracking-wide">Tagihan COD</span>
                              </div>
                              <span className="text-lg md:text-xl font-black text-orange-700">Rp {tagihan.toLocaleString("id-ID")}</span>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-1">
                            <Button 
                              variant="outline" 
                              className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-xl border-border hover:bg-muted" 
                              onClick={() => handlePrintSuratJalan(o)}
                              title="Cetak Surat Jalan"
                            >
                              <Printer className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
                            </Button>
                            <Button 
                              className="flex-1 h-12 md:h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg shadow-md shadow-primary/20 flex justify-between px-5 md:px-6 group"
                              onClick={() => handleCompleteDelivery(o)}
                            >
                              <span>Selesaikan Tugas</span>
                              <ChevronRight className="h-5 w-5 md:h-6 md:w-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB BARU: RIWAYAT SELESAI */}
          <TabsContent value="completed" className="focus-visible:outline-none">
            <Card className="rounded-[1.5rem] border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 pb-4 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" /> Riwayat Pengiriman Selesai
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handlePrintCompleted} className="h-9 gap-2 shadow-sm rounded-xl">
                  <Printer className="h-4 w-4 text-muted-foreground" /> Cetak Laporan
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {completedOrders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">Belum ada pengiriman yang diselesaikan.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30">
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Tanggal</th>
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Pelanggan</th>
                          <th className="px-5 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Alamat Tujuan</th>
                          <th className="px-5 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {completedOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4 text-foreground text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                            <td className="px-5 py-4 text-foreground text-sm font-bold">
                              {o.customerName} <br/>
                              <span className="text-xs font-normal text-muted-foreground">{o.customerPhone || '-'}</span>
                            </td>
                            <td className="px-5 py-4 text-foreground text-xs leading-relaxed max-w-[250px]">
                              {(o as any).deliveryAddress || o.customerAddress || '-'}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold whitespace-nowrap text-success">
                              Rp {getOrderTotal(o).toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourierDashboard;