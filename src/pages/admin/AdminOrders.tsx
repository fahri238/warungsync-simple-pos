import { useState } from "react";
import { getOrders, updateOrder } from "@/lib/store";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusOptions: OrderStatus[] = ["pending", "processing", "ready", "delivering", "completed"];
const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu", processing: "Diproses", ready: "Siap Ambil", delivering: "Diantar", completed: "Selesai"
};
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-accent/10 text-accent",
  processing: "bg-info/10 text-info",
  ready: "bg-primary/10 text-primary",
  delivering: "bg-secondary/80 text-secondary-foreground",
  completed: "bg-primary/10 text-primary",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState(getOrders);

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    const updated = { ...order, status };
    updateOrder(updated);
    setOrders(getOrders());
    toast.success(`Status diubah ke ${statusLabels[status]}`);
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
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.items.map(i => `${i.product.name} x${i.quantity}`).join(", ")}
                  </p>
                  <p className="text-sm font-bold text-primary">Rp {o.total.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("id-ID")}</p>
                </div>
                {o.status !== "completed" && (
                  <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v as OrderStatus)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
