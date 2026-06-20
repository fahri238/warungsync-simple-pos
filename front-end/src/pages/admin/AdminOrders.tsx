import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Printer, Truck, CheckCircle, Package } from "lucide-react";
import { fetchOrders, updateOrderStatus as updateOrderStatusApi } from "@/services/orderService";
import { fetchUsersByRole } from "@/services/authService";
import { assignCourier } from "@/services/deliveryService";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Sedang Diantar", completed: "Selesai"
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-blue-500/10 text-blue-600",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-orange-500/10 text-orange-600",
  completed: "bg-success/10 text-success",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);
  
  // special state fot popup choose courier
  const [courierDialogOrder, setCourierDialogOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");

  const refresh = async () => {
    const data = await fetchOrders();
    setOrders(data);
  };

  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsersByRole("kurir" as any)])
      .then(([orderRows, courierRows]) => {
        setOrders(orderRows);
        setCouriers(courierRows);
      })
      .finally(() => setLoading(false));
  }, []);

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === 'number') return order.total;
    const itemsTotal = order.items?.reduce((sum, item) => sum + (item.product?.price * item.quantity), 0) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  // --- ACTION STATUS CHANGE ---

  // 1. BTN "Proses" -> change status to "processing"
  const handleProcessOrder = async (orderId: string) => {
    try {
      await updateOrderStatusApi(orderId, { status: "processing" });
      toast.success("Pesanan mulai diproses");
      refresh();
    } catch (error) {
      toast.error("Gagal memproses pesanan");
    }
  };

  // 2. if Pickup: "Selesai (pickup by customer)" -> change status to "completed"
  const handleCompletePickup = async (orderId: string) => {
    try {
      await updateOrderStatusApi(orderId, { status: "completed" });
      toast.success("Pesanan telah diambil pelanggan");
      refresh();
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  // 3. if Delivery: open pop-up, choose courier
  const handleOpenCourierDialog = (order: Order) => {
    setSelectedCourierId("");
    setCourierDialogOrder(order);
  };

  // 4. Submited kurir
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

  // --- Print Function ---
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
        <title>Invoice #${order.id.slice(-6)}</title>
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
          <div class="title">WARUNG MAMA EVA</div>
          <div>Invoice / Struk Belanja</div>
          <div style="color: #555; font-size: 10px; margin-top: 4px;">${formattedDate}</div>
          <div style="color: #555; font-size: 10px;">ID: #${order.id.slice(-8).toUpperCase()}</div>
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

  // --- CARD ORDERS KOMPONEN  ---
  const renderOrderCard = (o: Order) => {
    const totalTagihan = getOrderTotal(o);
    const st = o.status || 'pending';

    return (
      <Card key={o.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between">
          <div className="p-5 flex-1 w-full">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-lg">{o.customerName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[st as OrderStatus] || 'bg-gray-100'}`}>
                {statusLabels[st as OrderStatus] || st}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{o.items?.map(i => i.product.name).join(", ") || "No items"}</p>
            <div className="flex gap-4 mt-2">
              <p className="font-bold text-primary">Rp {totalTagihan.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase bg-muted px-2 py-0.5 rounded">
                {o.fulfillment === 'delivery' ? 'Diantar Kurir' : 'Ambil Sendiri'}
              </p>
            </div>
          </div>
          
          <div className="flex sm:flex-col gap-2 p-5 sm:border-l border-t sm:border-t-0 border-border/50 w-full sm:w-auto bg-muted/10">
            <Button size="sm" onClick={() => handlePrintInvoice(o)} className="gap-2 w-full">
              <Printer className="h-4 w-4" /> Cetak Struk
            </Button>
            
            {/* btn action based on status logic */}
            {st === "pending" && (
              <Button size="sm" variant="outline" className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200" onClick={() => handleProcessOrder(o.id)}>
                Proses Pesanan
              </Button>
            )}

            {st === "processing" && o.fulfillment === "delivery" && (
              <Button size="sm" className="w-full gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => handleOpenCourierDialog(o)}>
                <Truck className="h-4 w-4" /> Tugaskan Kurir
              </Button>
            )}

            {st === "processing" && o.fulfillment === "pickup" && (
              <Button size="sm" className="w-full gap-2 bg-green-500 hover:bg-green-600" onClick={() => handleCompletePickup(o.id)}>
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
          {orders.filter(o => !o.status || o.status === "pending" || o.status === "processing").map(o => renderOrderCard(o))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {orders.filter(o => o.status === "completed").map(o => renderOrderCard(o))}
        </TabsContent>
      </Tabs>

      {/* POP-UP DIALOGUE CHOOSE KURIR */}
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
                  {couriers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.phone})
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

export default AdminOrders;