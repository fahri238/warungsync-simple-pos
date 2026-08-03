import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/store";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Truck,
  MapPin,
  Package,
  Phone,
  Store,
  ReceiptText,
  ChevronRight,
  Printer,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/custom-toast";
import { fetchOrders, updateOrderStatus } from "@/services/orderService";
import { completeDelivery } from "@/services/deliveryService";

const CourierDashboard = () => {
  const session = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (
      !session ||
      ((session.role as string) !== "courier" &&
        (session.role as string) !== "kurir")
    ) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    fetchOrders()
      .then((rows) => {
        const mine = rows.filter(
          (o: any) =>
            Number(o.courierId) === Number(session.id) &&
            (o.fulfillment === "delivery" || o.fulfillment === "kurir"),
        );
        setOrders(mine);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat data kurir");
      })
      .finally(() => setLoadingOrders(false));
  }, [session]);

  const activeOrders = useMemo(
    () =>
      orders.filter((o) =>
        [
          "delivering",
          "diantar",
          "processing",
          "diproses",
          "ready",
          "siap_ambil",
        ].includes(o.status as string),
      ),
    [orders],
  );

  const handleCompleteDelivery = async (order: Order) => {
    try {
      if ((order as any).deliveryId) {
        await completeDelivery((order as any).deliveryId);
      } else {
        await updateOrderStatus(order.id, { status: "completed" });
      }

      const rows = await fetchOrders();
      const mine = rows.filter(
        (o: any) =>
          Number(o.courierId) === Number(session.id) &&
          (o.fulfillment === "delivery" || o.fulfillment === "kurir"),
      );
      setOrders(mine);
      toast.success("Pengiriman berhasil diselesaikan!");
    } catch (error: any) {
      toast.error(error?.message || "Gagal memperbarui status pengiriman");
    }
  };

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === "number") return order.total;
    const itemsTotal =
      order.items?.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const handlePrintSuratJalan = (order: Order) => {
    const orderTotal = getOrderTotal(order);
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (i) => `
      <div class="row" style="border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px;">
        <span class="item-name">${i.product?.name || "Produk"}</span>
        <span class="bold">x${i.quantity}</span>
      </div>
    `,
      )
      .join("");

    const d = new Date();
    const formattedDate =
      d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
      " • " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const alamatTujuan = (order as any).deliveryAddress || order.customerAddress || "Alamat tidak dicantumkan";
    const namaToko = (order as any).storeName || (session as any)?.storeName || "TOKO MITRA WARUNGSYNC";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Jalan #${order.id.toString().slice(-6)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 15px; color: #000; box-sizing: border-box; }
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
          <div class="bold" style="font-size: 14px;">${order.customerName || "Pelanggan"}</div>
          <div class="bold" style="font-size: 14px; margin-top: 2px;">📞 ${order.customerPhone || "-"}</div>
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
          <div>Kurir: <span class="bold">${session?.name || "Kurir"}</span></div>
          <div style="margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; display: inline-block; width: 80%;">Tanda Tangan Penerima</div>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* KARTU RINGKASAN */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tugas Hari Ini</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Anda memiliki <span className="font-bold text-primary">{activeOrders.length} paket</span> yang sedang dalam antrian pengiriman.
          </p>
        </div>
        <div className="bg-background px-4 py-3 rounded-xl border border-border/50 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status Antrian</p>
            <p className="font-black text-lg text-foreground">{activeOrders.length > 0 ? 'Sibuk' : 'Santai'}</p>
          </div>
        </div>
      </div>

      {/* DAFTAR ANTRIAN */}
      {loadingOrders ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">
          Menyelaraskan data penugasan...
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 md:p-16 text-center shadow-sm border border-border/50 flex flex-col items-center">
          <div className="h-20 w-20 md:h-24 md:w-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/40" />
          </div>
          <p className="font-bold text-foreground text-lg md:text-xl">Semua Tugas Selesai!</p>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-sm mx-auto">
            Belum ada paket baru yang ditugaskan kepada Anda. Silakan beristirahat.
          </p>
        </div>
      ) : (
        /* PERBAIKAN GRID: Menjadikan 1 kolom saja yang merentang 100% lebar layar */
        <div className="grid grid-cols-1 gap-6 items-start">
          {activeOrders.map((o) => {
            const tagihan = getOrderTotal(o);
            const alamatTujuan = (o as any).deliveryAddress || o.customerAddress || "Alamat tidak lengkap";

            return (
              <Card key={o.id} className="overflow-hidden border-border/60 shadow-md rounded-[1.5rem] hover:shadow-lg transition-all w-full">
                {/* HEADER KARTU */}
                <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 md:p-5 flex justify-between items-center border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="bg-background px-3 py-1.5 rounded-lg border border-border/50 hidden sm:block">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        ID: {o.id.toString().slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider sm:hidden block mb-0.5">
                        ID: {o.id.toString().slice(-6).toUpperCase()}
                      </span>
                      <p className="font-extrabold text-foreground text-base md:text-lg leading-tight">
                        {o.customerName}
                      </p>
                    </div>
                  </div>
                  <span className="bg-background px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold shadow-sm border border-border/50 text-foreground shrink-0">
                    Sedang Diantar
                  </span>
                </div>

                <CardContent className="p-5 md:p-6">
                  {/* DESAIN BARU: Memecah isi kartu menjadi 3 kolom di layar Laptop/Desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                    
                    {/* BAGIAN 1: RUTE PENGIRIMAN (Kiri) */}
                    <div className="lg:col-span-5 flex gap-4">
                      <div className="flex flex-col items-center mt-1">
                        <div className="h-3 w-3 rounded-full bg-secondary ring-4 ring-secondary/20 z-10 shrink-0" />
                        <div className="w-0.5 h-full min-h-[3rem] bg-border -my-1" />
                        <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20 z-10 shrink-0" />
                      </div>
                      <div className="flex-1 space-y-5">
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Ambil di</p>
                          <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-foreground">
                            <Store className="h-4 w-4 text-secondary shrink-0" /> 
                            <span>{(o as any).storeName || (session as any)?.storeName || "Toko Mitra"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Antar ke</p>
                          <div className="flex items-start gap-2 text-sm md:text-base font-semibold text-foreground">
                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="leading-snug">{alamatTujuan}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BAGIAN 2: RINCIAN BARANG & HUBUNGI (Tengah) */}
                    <div className="lg:col-span-4 bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" /> {o.items.reduce((sum, i) => sum + i.quantity, 0)} Barang
                        </p>
                        <a href={`tel:${o.customerPhone}`} className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline bg-secondary/10 px-2 py-1 rounded-md">
                          <Phone className="h-3.5 w-3.5" /> Hubungi
                        </a>
                      </div>
                      <div className="space-y-2 max-h-[85px] overflow-y-auto custom-scrollbar pr-2">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2 text-sm border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                            <span className="font-medium text-foreground truncate">{item.product.name}</span>
                            <span className="font-bold text-primary shrink-0">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BAGIAN 3: TAGIHAN & AKSI (Kanan) */}
                    <div className="lg:col-span-3 flex flex-col justify-between space-y-4 h-full">
                      <div className="flex items-center justify-between bg-orange-100 border border-orange-200 rounded-lg p-3.5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ReceiptText className="h-5 w-5 text-orange-700 shrink-0" />
                          <span className="text-xs font-bold text-orange-800 uppercase tracking-wide hidden xl:inline">Tagihan</span>
                        </div>
                        <span className="text-lg font-black text-orange-700 whitespace-nowrap">Rp {tagihan.toLocaleString("id-ID")}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" className="h-11 w-12 shrink-0 rounded-xl border-border hover:bg-muted" onClick={() => handlePrintSuratJalan(o)} title="Cetak Surat Jalan">
                          <Printer className="h-5 w-5 text-secondary" />
                        </Button>
                        <Button className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md flex justify-between px-4 group" onClick={() => handleCompleteDelivery(o)}>
                          <span className="text-sm">Selesai</span>
                          <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourierDashboard;