import { useState } from "react";
import { getOrders, updateOrder, updateOrderStatus, getUsers, addDelivery, generateId } from "@/lib/store";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Truck, CheckCircle, Clock, ArrowRight } from "lucide-react";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Diambil", delivering: "Diantar", completed: "Selesai"
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-blue-500/10 text-blue-600",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-orange-500/10 text-orange-600",
  completed: "bg-primary/10 text-primary",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState(getOrders);
  const [courierDialogOrder, setCourierDialogOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");

  const couriers = getUsers().filter(u => u.role === "courier");
  const refresh = () => setOrders(getOrders());

  // Step 1: pending → processing (Proses Pesanan)
  const handleProcess = (order: Order) => {
    updateOrderStatus(order.id, "processing");
    refresh();
    toast.success("Pesanan sedang diproses");
  };

  // Step 2a (Pickup): processing → ready (Siap Diambil)
  const handleReadyPickup = (order: Order) => {
    updateOrderStatus(order.id, "ready");
    refresh();
    toast.success("Pesanan siap diambil");
  };

  // Step 2b (Delivery): open courier selection dialog
  const handleOpenCourierDialog = (order: Order) => {
    setSelectedCourierId("");
    setCourierDialogOrder(order);
  };

  // Step 2b (Delivery): assign courier → create Delivery record, status → delivering
  const handleAssignCourier = () => {
    if (!courierDialogOrder || !selectedCourierId) return;
    const courier = couriers.find(c => c.id === selectedCourierId);
    if (!courier) return;

    // Create Delivery record
    addDelivery({
      id: generateId(),
      orderId: courierDialogOrder.id,
      courierId: selectedCourierId,
      address: courierDialogOrder.customerAddress || "-",
      status: "delivering",
      updatedAt: new Date().toISOString(),
    });

    // Update order status & courierId
    const updated: Order = { ...courierDialogOrder, status: "delivering", courierId: selectedCourierId };
    updateOrder(updated);

    setCourierDialogOrder(null);
    refresh();
    toast.success(`Pesanan dikirim oleh ${courier.name}`);
  };

  // For pickup: admin can mark as completed
  const handleCompletePickup = (order: Order) => {
    updateOrderStatus(order.id, "completed");
    refresh();
    toast.success("Pesanan selesai");
  };

  const renderActions = (o: Order) => {
    // POS orders are already completed
    if (o.type === "pos" || o.status === "completed") return null;

    switch (o.status) {
      case "pending":
        return (
          <Button size="sm" className="gap-2" onClick={() => handleProcess(o)}>
            <ArrowRight className="h-4 w-4" /> Proses Pesanan
          </Button>
        );
      case "processing":
        if (o.fulfillment === "delivery") {
          return (
            <Button size="sm" className="gap-2" onClick={() => handleOpenCourierDialog(o)}>
              <Truck className="h-4 w-4" /> Pilih Kurir & Kirim
            </Button>
          );
        }
        return (
          <Button size="sm" className="gap-2" onClick={() => handleReadyPickup(o)}>
            <Package className="h-4 w-4" /> Siap Diambil
          </Button>
        );
      case "ready":
        // Only pickup orders reach "ready" — admin can mark completed when customer picks up
        if (o.fulfillment === "pickup") {
          return (
            <Button size="sm" className="gap-2" onClick={() => handleCompletePickup(o)}>
              <CheckCircle className="h-4 w-4" /> Selesai (Diambil)
            </Button>
          );
        }
        return null;
      case "delivering":
        // Courier will complete this — show info
        return (
          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
            <Truck className="h-3 w-3" /> Menunggu kurir menyelesaikan
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <h2 className="text-xl font-bold text-foreground">Pesanan ({orders.length})</h2>
      {orders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada pesanan.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <Card key={o.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{o.customerName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>
                      {statusLabels[o.status]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {o.type === "pos" ? "POS" : "Online"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {o.fulfillment === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}
                  </p>
                  <p className="text-sm font-bold text-primary">Rp {o.total.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("id-ID")}</p>
                  {o.courierId && (
                    <p className="text-xs text-muted-foreground">
                      Kurir: {couriers.find(c => c.id === o.courierId)?.name || o.courierId}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {renderActions(o)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Courier Selection Dialog */}
      <Dialog open={!!courierDialogOrder} onOpenChange={(open) => !open && setCourierDialogOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kurir untuk Pengiriman</DialogTitle>
          </DialogHeader>
          {courierDialogOrder && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/50 text-sm space-y-1">
                <p className="font-medium text-foreground">Pesanan: {courierDialogOrder.customerName}</p>
                <p className="text-muted-foreground">Alamat: {courierDialogOrder.customerAddress || "-"}</p>
                <p className="font-bold text-primary">Total: Rp {courierDialogOrder.total.toLocaleString("id-ID")}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pilih Kurir</label>
                {couriers.length === 0 ? (
                  <p className="text-sm text-destructive">Belum ada kurir terdaftar.</p>
                ) : (
                  <Select value={selectedCourierId} onValueChange={setSelectedCourierId}>
                    <SelectTrigger><SelectValue placeholder="Pilih kurir..." /></SelectTrigger>
                    <SelectContent>
                      {couriers.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} — {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourierDialogOrder(null)}>Batal</Button>
            <Button disabled={!selectedCourierId} className="gap-2" onClick={handleAssignCourier}>
              <Truck className="h-4 w-4" /> Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
