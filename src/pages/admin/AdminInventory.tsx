import { useState } from "react";
import { getProducts, saveProducts, addStockLog, generateId } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminInventory = () => {
  const [products, setProducts] = useState(getProducts);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  const handleAdjust = () => {
    if (adjustQty === 0) return;
    const updated = products.map(p => {
      if (p.id === adjusting) {
        const newStock = Math.max(0, p.stock + adjustQty);
        addStockLog({
          id: generateId(),
          productId: p.id,
          productName: p.name,
          change: adjustQty,
          reason: adjustReason || "Manual adjustment",
          createdAt: new Date().toISOString(),
        });
        return { ...p, stock: newStock };
      }
      return p;
    });
    saveProducts(updated);
    setProducts(updated);
    setAdjusting(null);
    setAdjustQty(0);
    setAdjustReason("");
    toast.success("Stok diperbarui");
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <h2 className="text-xl font-bold text-foreground">Inventori Stok</h2>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stok</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.image}</span>
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-foreground">{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.stock === 0 ? "bg-destructive/10 text-destructive" :
                    p.stock <= 10 ? "bg-accent/10 text-accent" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {p.stock === 0 ? "Habis" : p.stock <= 10 ? "Rendah" : "Aman"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => { setAdjusting(p.id); setAdjustQty(0); }}>
                    Sesuaikan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!adjusting} onOpenChange={() => setAdjusting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sesuaikan Stok</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jumlah (+ untuk tambah, - untuk kurang)</Label>
              <Input type="number" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))} />
            </div>
            <div>
              <Label>Alasan</Label>
              <Input placeholder="Restok, rusak, dll." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleAdjust}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventory;
