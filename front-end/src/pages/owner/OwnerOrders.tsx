import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/custom-toast";
import {
  Printer,
  Truck,
  CheckCircle,
  ShieldAlert,
  Eye,
  MapPin,
  CreditCard,
  PackageOpen,
  User,
  Phone,
  Banknote,
  Navigation,
  Image as ImageIcon
} from "lucide-react";
import {
  fetchOrders,
  updateOrderStatus as updateOrderStatusApi,
} from "@/services/orderService";
import { fetchUsersByRole } from "@/services/authService";
import { assignCourier } from "@/services/deliveryService";
import { getSession } from "@/lib/store";

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  menunggu: "Menunggu",
  processing: "Diproses",
  diproses: "Diproses",
  ready: "Siap Ambil",
  siap_ambil: "Siap Ambil",
  delivering: "Sedang Diantar",
  diantar: "Sedang Diantar",
  completed: "Selesai",
  selesai: "Selesai",
};

const statusColors: Record<string, string> = {
  pending: "bg-accent/10 text-accent",
  menunggu: "bg-accent/10 text-accent",
  processing: "bg-blue-500/10 text-blue-600",
  diproses: "bg-blue-500/10 text-blue-600",
  ready: "bg-primary/10 text-primary",
  siap_ambil: "bg-primary/10 text-primary",
  delivering: "bg-orange-500/10 text-orange-600",
  diantar: "bg-orange-500/10 text-orange-600",
  completed: "bg-success/10 text-success",
  selesai: "bg-success/10 text-success",
};

const OwnerOrders = () => {
  const session = getSession();

  const displayStoreName =
    (session as any)?.nama_toko ||
    (session as any)?.store_name ||
    `Toko ${session?.name || "Kita"}`;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);

  // Dialog Kurir
  const [courierDialogOrder, setCourierDialogOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");

  // Dialog Detail Pesanan
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const refresh = async () => {
    if (!session?.store_id) return;
    const data = await fetchOrders(session.store_id as any);
    setOrders(data || []);
  };

  useEffect(() => {
    if (!session || session.role !== "owner") {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchOrders(session.store_id as any),
      fetchUsersByRole("kurir"),
    ])
      .then(([orderRows, courierRows]) => {
        setOrders(orderRows || []);
        setCouriers(courierRows || []);
      })
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [session?.store_id, session?.role]);

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === "number") return order.total;
    const itemsTotal =
      order.items?.reduce(
        (sum, item) => sum + item.product?.price * item.quantity,
        0,
      ) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const handleProcessOrder = async (orderId: string) => {
    try {
      await updateOrderStatusApi(orderId, { status: "processing" });
      toast.success("Pesanan mulai diproses");
      refresh();
      setIsDetailOpen(false); // Tutup dialog jika diproses dari dalam
    } catch (error) {
      toast.error("Gagal memproses pesanan");
    }
  };

  const handleCompletePickup = async (orderId: string) => {
    try {
      await updateOrderStatusApi(orderId, { status: "completed" });
      toast.success("Pesanan telah diambil pelanggan");
      refresh();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleOpenCourierDialog = (order: Order) => {
    setSelectedCourierId("");
    setCourierDialogOrder(order);
    setIsDetailOpen(false); // Tutup detail jika pindah ke tugaskan kurir
  };

  const handleSubmitAssignCourier = async () => {
    if (!courierDialogOrder || !selectedCourierId) return;
    try {
      await assignCourier(courierDialogOrder.id, selectedCourierId);
      toast.success("Kurir berhasil ditugaskan!");
      setCourierDialogOrder(null);
      refresh();
    } catch (error) {
      toast.error("Gagal menugaskan kurir");
    }
  };

  const handleViewDetail = (order: Order) => {
    setDetailOrder(order);
    setIsDetailOpen(true);
  };

  const handlePrintInvoice = (order: Order) => {
    const orderTotal = getOrderTotal(order);
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (i) => `
      <div class="row">
        <span class="item-name">${i.product?.name || "Product"} x${i.quantity}</span>
        <span>Rp ${(i.product?.price * i.quantity).toLocaleString("id-ID")}</span>
      </div>
    `,
      )
      .join("");

    const d = new Date(order.createdAt || Date.now());
    const formattedDate =
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " • " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id.toString().slice(-6)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 15px; color: #000; box-sizing: border-box; }
          @media screen { body { background-color: white; border: 1px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; min-height: 200px; } html { background-color: #f0f0f0; } }
          .center { text-align: center; } .bold { font-weight: bold; } .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; } .item-name { flex: 1; padding-right: 15px; word-break: break-word; }
          .title { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase;}
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${displayStoreName}</div>
          <div>Invoice / Struk Belanja</div>
          <div style="color: #555; font-size: 10px; margin-top: 4px;">${formattedDate}</div>
          <div style="color: #555; font-size: 10px;">ID: #${order.id.toString().slice(-8).toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div>Customer: <span class="bold">${order.customerName || "Walk-in"}</span></div>
        <div>Type: <span class="bold">${order.fulfillment === "delivery" ? "Delivery" : "Pickup"}</span></div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row bold" style="font-size: 14px;">
          <span>TOTAL</span>
          <span>Rp ${orderTotal.toLocaleString("id-ID")}</span>
        </div>
        <div class="divider"></div>
        <div class="center" style="margin-top: 15px; font-size: 10px; color: #555;">
          Terima kasih atas pesanan Anda!<br/>Harap simpan struk ini sebagai bukti.
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!session || session.role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-[2rem] overflow-hidden relative">
          <div className="h-2 bg-destructive w-full absolute top-0 left-0"></div>
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/5">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-foreground">
              Akses Ditolak
            </h2>
            <p className="mb-8 text-muted-foreground text-sm px-4">
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak
              memiliki izin untuk mengakses halaman ini.
            </p>
            <Button
              asChild
              className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20"
            >
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderOrderCard = (o: Order) => {
    const totalTagihan = getOrderTotal(o);
    const st = (o.status as string) || "pending";
    const fulfillment = o.fulfillment as string;

    return (
      <Card
        key={o.id}
        className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all"
      >
        <CardContent className="p-0 flex flex-col sm:flex-row items-stretch justify-between">
          <div className="p-5 flex-1 w-full">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{o.customerName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[st] || "bg-gray-100"}`}
                >
                  {statusLabels[st] || st}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">#{o.id.toString().slice(-6).toUpperCase()}</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
              {o.items?.map((i) => `${i.product.name} (x${i.quantity})`).join(", ") || "Tidak ada barang"}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-black text-primary text-lg">
                Rp {totalTagihan.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase bg-muted/50 border border-border/50 px-2 py-1 rounded-md flex items-center gap-1">
                   {fulfillment === "delivery" || fulfillment === "kurir" ? <Truck className="h-3 w-3" /> : <PackageOpen className="h-3 w-3" />}
                   {fulfillment === "delivery" || fulfillment === "kurir" ? "Dikirim" : "Ambil Sendiri"}
                </span>
                {(o as any).metode_pembayaran === "transfer" && (
                   <span className="text-[10px] text-blue-600 font-semibold uppercase bg-blue-50 border border-blue-200 px-2 py-1 rounded-md flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Transfer
                 </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 p-5 sm:border-l border-t sm:border-t-0 border-border/50 w-full sm:w-48 bg-muted/10 shrink-0 justify-center">
             <Button
              size="sm"
              variant="secondary"
              className="gap-2 w-full font-bold shadow-sm"
              onClick={() => handleViewDetail(o)}
            >
              <Eye className="h-4 w-4" /> Detail Pesanan
            </Button>

            {(st === "pending" || st === "menunggu") && (
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-sm shadow-blue-500/20"
                onClick={() => handleProcessOrder(o.id.toString())}
              >
                Proses Sekarang
              </Button>
            )}

            {(st === "processing" || st === "diproses") &&
              (fulfillment === "delivery" || fulfillment === "kurir") && (
                <Button
                  size="sm"
                  className="w-full gap-2 bg-orange-500 hover:bg-orange-600 font-bold shadow-sm shadow-orange-500/20"
                  onClick={() => handleOpenCourierDialog(o)}
                >
                  <Truck className="h-4 w-4" /> Tugaskan Kurir
                </Button>
              )}

            {(st === "processing" || st === "diproses") &&
              fulfillment === "pickup" && (
                <Button
                  size="sm"
                  className="w-full gap-2 bg-green-500 hover:bg-green-600 font-bold shadow-sm shadow-green-500/20"
                  onClick={() => handleCompletePickup(o.id.toString())}
                >
                  <CheckCircle className="h-4 w-4" /> Tandai Diambil
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Manajemen Pesanan</h2>
        <Button onClick={refresh} variant="outline" size="sm" className="shadow-sm">
          Perbarui Data
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">Semua</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">Menunggu</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {orders.length === 0 ? <p className="text-muted-foreground text-center py-10">Belum ada pesanan.</p> : orders.map((o) => renderOrderCard(o))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {orders
            .filter(
              (o) =>
                !o.status ||
                ["pending", "menunggu", "processing", "diproses"].includes(
                  o.status as string,
                ),
            )
            .map((o) => renderOrderCard(o))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {orders
            .filter((o) =>
              ["completed", "selesai"].includes(o.status as string),
            )
            .map((o) => renderOrderCard(o))}
        </TabsContent>
      </Tabs>

      {/* DIALOG DETAIL PESANAN KOMPREHENSIF */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <div className="bg-primary/5 border-b border-border/50 px-6 py-4 flex justify-between items-center">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <PackageOpen className="h-5 w-5 text-primary" /> Rincian Pesanan
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                ID: #{detailOrder?.id.toString().toUpperCase()} • {new Date(detailOrder?.createdAt || Date.now()).toLocaleString("id-ID")}
              </p>
            </div>
            {detailOrder && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm border border-border/50 ${statusColors[(detailOrder.status as string) || "pending"]}`}>
                {statusLabels[(detailOrder.status as string) || "pending"]}
              </span>
            )}
          </div>
          
          {detailOrder && (
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Info Pelanggan</p>
                  <div>
                    <p className="font-semibold">{detailOrder.customerName}</p>
                    <p className="text-sm flex items-center gap-1.5 text-muted-foreground mt-1"><Phone className="h-3 w-3" /> {detailOrder.customerPhone || "-"}</p>
                  </div>
                </div>

                <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Tipe Pemenuhan</p>
                  <div>
                    <p className="font-semibold capitalize">
                      {detailOrder.fulfillment === "delivery" || detailOrder.fulfillment === "kurir" ? "Diantar Kurir" : "Ambil Sendiri (Pickup)"}
                    </p>
                    <p className="text-sm flex items-center gap-1.5 text-muted-foreground mt-1 capitalize"><Banknote className="h-3 w-3" /> Pembayaran: {(detailOrder as any).metode_pembayaran || "Cash"}</p>
                  </div>
                </div>
              </div>

              {(detailOrder.fulfillment === "delivery" || detailOrder.fulfillment === "kurir") && (
                <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Alamat Pengiriman</p>
                  <p className="text-sm font-medium leading-relaxed">
                     {(detailOrder as any).deliveryAddress || detailOrder.customerAddress || "Tidak ada alamat spesifik"}
                  </p>
                  {(detailOrder as any).latitude && (detailOrder as any).longitude && (
                    <div className="pt-2 mt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                       <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${(detailOrder as any).latitude},${(detailOrder as any).longitude}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-100/50 px-2 py-1 rounded"
                      >
                        <Navigation className="h-3 w-3" /> Buka di Google Maps
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">Rincian Belanja</p>
                <div className="space-y-3">
                  {detailOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded text-xs">x{item.quantity}</span>
                        <span className="font-medium">{item.product.name}</span>
                      </div>
                      <span className="font-semibold">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-2">
                {(detailOrder as any).shippingFee > 0 && (
                   <div className="flex justify-between items-center text-sm text-muted-foreground">
                     <span>Ongkos Kirim</span>
                     <span>Rp {Number((detailOrder as any).shippingFee).toLocaleString("id-ID")}</span>
                   </div>
                )}
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  <span className="font-bold text-primary">Total Tagihan</span>
                  <span className="font-black text-lg text-primary">Rp {getOrderTotal(detailOrder).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {(detailOrder as any).metode_pembayaran === "transfer" && (
                <div className="border-t border-border/50 pt-5">
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Bukti Pembayaran</p>
                   {(detailOrder as any).bukti_transfer ? (
                     <div className="bg-muted/30 border border-border/80 rounded-xl p-2 flex justify-center">
                        <img 
                          src={`http://localhost:5000/uploads/transfers/${(detailOrder as any).bukti_transfer}`} 
                          alt="Bukti Transfer" 
                          className="max-h-[300px] w-auto rounded-lg shadow-sm border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(`http://localhost:5000/uploads/transfers/${(detailOrder as any).bukti_transfer}`, '_blank')}
                          title="Klik untuk memperbesar"
                        />
                     </div>
                   ) : (
                     <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-center text-sm border border-orange-200">
                       Pelanggan belum mengunggah bukti transfer.
                     </div>
                   )}
                </div>
              )}

            </div>
          )}

          {/* AKSI BAWAH DIALOG (DIPERBAIKI UNTUK TYPESCRIPT) */}
          <div className="bg-muted/30 border-t border-border/50 px-6 py-4 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => handlePrintInvoice(detailOrder!)} className="gap-2">
              <Printer className="h-4 w-4" /> Cetak
            </Button>
            
            {(() => {
               if (!detailOrder) return null;
               const st = (detailOrder.status as string) || "pending";
               const fulfill = (detailOrder.fulfillment as string) || "pickup";

               return (
                 <>
                   {(st === "pending" || st === "menunggu") && (
                     <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleProcessOrder(detailOrder.id.toString())}>
                       Proses Sekarang
                     </Button>
                   )}

                   {(st === "processing" || st === "diproses") && (fulfill === "delivery" || fulfill === "kurir") && (
                     <Button className="bg-orange-500 hover:bg-orange-600 gap-2" onClick={() => handleOpenCourierDialog(detailOrder)}>
                       <Truck className="h-4 w-4" /> Tugaskan Kurir
                     </Button>
                   )}
                   {(st === "processing" || st === "diproses") && fulfill === "pickup" && (
                     <Button className="bg-green-500 hover:bg-green-600 gap-2" onClick={() => handleCompletePickup(detailOrder.id.toString())}>
                       <CheckCircle className="h-4 w-4" /> Tandai Diambil
                     </Button>
                   )}
                 </>
               );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!courierDialogOrder}
        onOpenChange={(open) => !open && setCourierDialogOrder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tugaskan Kurir Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold text-foreground">
                Pelanggan: {courierDialogOrder?.customerName}
              </p>
              <p className="text-muted-foreground mt-1">
                Alamat:{" "}
                {(courierDialogOrder as any)?.deliveryAddress ||
                  courierDialogOrder?.customerAddress}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pilih Kurir yang Tersedia:
              </label>
              <Select
                value={selectedCourierId}
                onValueChange={setSelectedCourierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Klik untuk memilih kurir --" />
                </SelectTrigger>
                <SelectContent>
                  {couriers
                    .filter(
                      (c) =>
                        Number(c.store_id || c.storeId) ===
                        Number(session?.store_id),
                    )
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nama || c.name}{" "}
                        {c.kontak || c.phone ? `(${c.kontak || c.phone})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCourierDialogOrder(null)}
            >
              Batal
            </Button>
            <Button
              disabled={!selectedCourierId}
              onClick={handleSubmitAssignCourier}
              className="gap-2"
            >
              <Truck className="h-4 w-4" /> Konfirmasi & Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerOrders;