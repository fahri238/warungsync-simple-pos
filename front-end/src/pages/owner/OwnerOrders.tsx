import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Printer, Truck, CheckCircle, ShieldAlert } from "lucide-react";
import { fetchOrders, updateOrderStatus as updateOrderStatusApi } from "@/services/orderService";
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
  selesai: "Selesai"
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);
  
  const [courierDialogOrder, setCourierDialogOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");

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
      fetchUsersByRole("kurir") // PERBAIKAN 1: Ubah 'courier' menjadi 'kurir' (bahasa Indonesia)
    ])
      .then(([orderRows, courierRows]) => {
        setOrders(orderRows || []);
        setCouriers(courierRows || []);
      })
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [session?.store_id, session?.role]);

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === 'number') return order.total;
    const itemsTotal = order.items?.reduce((sum, item) => sum + (item.product?.price * item.quantity), 0) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const handleProcessOrder = async (orderId: string) => {
    try {
      await updateOrderStatusApi(orderId, { status: "processing" });
      toast.success("Pesanan mulai diproses");
      refresh();
    } catch (error) {
      toast.error("Gagal memproses pesanan");
    }
  };

  const handleCompletePickup = async (orderId: string) => {
    try {
      await updateOrderStatusApi(orderId, { status: "completed" });
      toast.success("Pesanan telah diambil pelanggan");
      refresh();
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleOpenCourierDialog = (order: Order) => {
    setSelectedCourierId("");
    setCourierDialogOrder(order);
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

  const handlePrintInvoice = (order: Order) => {
    const orderTotal = getOrderTotal(order);
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map(i => `
      <div class="row">
        <span class="item-name">${i.product?.name || 'Product'} x${i.quantity}</span>
        <span>Rp ${(i.product?.price * i.quantity).toLocaleString("id-ID")}</span>
      </div>
    `).join('');

    const d = new Date(order.createdAt || Date.now());
    const formattedDate = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
      " • " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

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
          <div class="title">Toko ${session?.name?.split(' ')[0] || 'Kita'}</div>
          <div>Invoice / Struk Belanja</div>
          <div style="color: #555; font-size: 10px; margin-top: 4px;">${formattedDate}</div>
          <div style="color: #555; font-size: 10px;">ID: #${order.id.toString().slice(-8).toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div>Customer: <span class="bold">${order.customerName || 'Walk-in'}</span></div>
        <div>Type: <span class="bold">${order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}</span></div>
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
            <h2 className="text-2xl font-black tracking-tight mb-2 text-foreground">Akses Ditolak</h2>
            <p className="mb-8 text-muted-foreground text-sm px-4">
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <Button asChild className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20">
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderOrderCard = (o: Order) => {
    const totalTagihan = getOrderTotal(o);
    // PERBAIKAN: Cast status dan fulfillment ke generic string agar TS tidak komplain
    const st = (o.status as string) || 'pending';
    const fulfillment = (o.fulfillment as string);

    return (
      <Card key={o.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between">
          <div className="p-5 flex-1 w-full">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-lg">{o.customerName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[st] || 'bg-gray-100'}`}>
                {statusLabels[st] || st}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{o.items?.map(i => i.product.name).join(", ") || "No items"}</p>
            <div className="flex gap-4 mt-2">
              <p className="font-bold text-primary">Rp {totalTagihan.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase bg-muted px-2 py-0.5 rounded">
                {fulfillment === 'delivery' || fulfillment === 'kurir' ? 'Diantar Kurir' : 'Ambil Sendiri'}
              </p>
            </div>
          </div>
          
          <div className="flex sm:flex-col gap-2 p-5 sm:border-l border-t sm:border-t-0 border-border/50 w-full sm:w-auto bg-muted/10">
            <Button size="sm" onClick={() => handlePrintInvoice(o)} className="gap-2 w-full">
              <Printer className="h-4 w-4" /> Cetak Struk
            </Button>
            
            {(st === "pending" || st === "menunggu") && (
              <Button size="sm" variant="outline" className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200" onClick={() => handleProcessOrder(o.id.toString())}>
                Proses Pesanan
              </Button>
            )}

            {(st === "processing" || st === "diproses") && (fulfillment === "delivery" || fulfillment === "kurir") && (
              <Button size="sm" className="w-full gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => handleOpenCourierDialog(o)}>
                <Truck className="h-4 w-4" /> Tugaskan Kurir
              </Button>
            )}

            {(st === "processing" || st === "diproses") && (fulfillment === "pickup") && (
              <Button size="sm" className="w-full gap-2 bg-green-500 hover:bg-green-600" onClick={() => handleCompletePickup(o.id.toString())}>
                <CheckCircle className="h-4 w-4" /> Selesai (Diambil)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manajemen Pesanan</h2>
        <Button onClick={refresh} variant="outline" size="sm">Perbarui Data</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="pending">Menunggu</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {orders.map(o => renderOrderCard(o))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {/* PERBAIKAN: Cast status ke generic string saat melakukan filter array */}
          {orders.filter(o => !o.status || ["pending", "menunggu", "processing", "diproses"].includes(o.status as string)).map(o => renderOrderCard(o))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {orders.filter(o => ["completed", "selesai"].includes(o.status as string)).map(o => renderOrderCard(o))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!courierDialogOrder} onOpenChange={(open) => !open && setCourierDialogOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tugaskan Kurir Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold text-foreground">Pelanggan: {courierDialogOrder?.customerName}</p>
              <p className="text-muted-foreground mt-1">Alamat: {(courierDialogOrder as any)?.deliveryAddress || courierDialogOrder?.customerAddress}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Kurir yang Tersedia:</label>
              <Select value={selectedCourierId} onValueChange={setSelectedCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Klik untuk memilih kurir --" />
                </SelectTrigger>
                <SelectContent>
                  {couriers
                    // PERBAIKAN 1: Filter agar hanya kurir dari toko ini yang muncul
                    .filter(c => Number(c.store_id || c.storeId) === Number(session?.store_id))
                    .map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {/* PERBAIKAN 2: Gunakan properti bahasa Indonesia (nama & kontak) */}
                      {c.nama || c.name} {(c.kontak || c.phone) ? `(${c.kontak || c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourierDialogOrder(null)}>Batal</Button>
            <Button disabled={!selectedCourierId} onClick={handleSubmitAssignCourier} className="gap-2">
              <Truck className="h-4 w-4" /> Konfirmasi & Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerOrders;