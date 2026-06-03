<<<<<<< HEAD
import { useState, useMemo, useCallback, useRef } from "react";
import { getProducts, getCategories, updateStock, addOrder, generateId, getProductImage } from "@/lib/store";
=======
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { getProductsFromAPI, getCategoriesFromAPI, getProductImage } from "@/lib/store";
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
import type { Product, OrderItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, Banknote, Receipt, Printer } from "lucide-react";
import { toast } from "sonner";
<<<<<<< HEAD
=======
import { createOrder } from "@/services/orderService";
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c

interface CompletedSale {
  orderId: string;
  items: OrderItem[];
  total: number;
  cashReceived: number;
  change: number;
  createdAt: string;
}

const AdminPOS = () => {
<<<<<<< HEAD
  const [products, setProducts] = useState(getProducts);
  const categories = getCategories();
=======
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  // Payment flow
  const [showPayment, setShowPayment] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const cashInputRef = useRef<HTMLInputElement>(null);
<<<<<<< HEAD
=======
  const [submitting, setSubmitting] = useState(false);
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c

  // Receipt
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

<<<<<<< HEAD
=======
  useEffect(() => {
    Promise.all([getProductsFromAPI(), getCategoriesFromAPI()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => {
        toast.error("Gagal memuat data POS");
      });
  }, []);

>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      return matchSearch && matchCat && p.stock > 0;
    });
  }, [products, search, catFilter]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);

  const addToCart = useCallback((p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) { toast.error("Stok tidak cukup"); return prev; }
        return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === id) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return i;
        if (newQty > i.product.stock) { toast.error("Stok tidak cukup"); return i; }
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

  // Step 1: Click "Bayar" → open payment dialog
  const handlePayClick = () => {
    if (cart.length === 0) return;
    setCashInput("");
    setShowPayment(true);
    setTimeout(() => cashInputRef.current?.focus(), 100);
  };

  // Step 2: Confirm payment with cash amount
<<<<<<< HEAD
  const confirmPayment = () => {
=======
  const confirmPayment = async () => {
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
    const cash = parseInt(cashInput.replace(/\D/g, ""), 10);
    if (!cash || cash < total) {
      toast.error("Uang tunai tidak cukup!");
      return;
    }

    const change = cash - total;
<<<<<<< HEAD
    const orderId = generateId();

    // Save to Order table
    updateStock(cart); // Reduces stock + records StockLog
    addOrder({
      id: orderId,
      items: cart,
      total,
      status: "completed",
      paymentMethod: "cash",
      type: "pos",
      fulfillment: "pickup",
      customerName: "Walk-in",
      customerPhone: "-",
      createdAt: new Date().toISOString(),
    });

    // Show receipt
    setCompletedSale({
      orderId,
      items: [...cart],
      total,
      cashReceived: cash,
      change,
      createdAt: new Date().toISOString(),
    });

    setCart([]);
    setShowPayment(false);
    setProducts(getProducts()); // Refresh product list with updated stock
    toast.success("Transaksi berhasil!");
=======
    const createdAt = new Date().toISOString();

    try {
      setSubmitting(true);
      const response = await createOrder({
        customerName: "Walk-in",
        customerPhone: "-",
        type: "pos",
        fulfillment: "pickup",
        paymentMethod: "cash",
        status: "completed",
        items: cart,
      });
      const orderId = response?.data?.id || `local-${Date.now()}`;

      // Show receipt
      setCompletedSale({
        orderId,
        items: [...cart],
        total,
        cashReceived: cash,
        change,
        createdAt,
      });

      setCart([]);
      setShowPayment(false);
      setProducts((prev) =>
        prev.map((product) => {
          const cartItem = cart.find((item) => item.product.id === product.id);
          if (!cartItem) return product;
          return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
        }),
      );
      toast.success("Transaksi berhasil!");
    } catch (error: any) {
      toast.error(error?.message || "Transaksi gagal");
    } finally {
      setSubmitting(false);
    }
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
  };

  // Print receipt
  const printReceipt = () => {
    const receiptEl = document.getElementById("pos-receipt");
    if (!receiptEl) return;
    const printWindow = window.open("", "_blank", "width=350,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Struk</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-name { flex: 1; }
      </style></head><body>
      ${receiptEl.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row animate-slide-in">
      {/* Product Grid */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button size="sm" variant={catFilter === "all" ? "default" : "outline"} onClick={() => setCatFilter("all")}>Semua</Button>
            {categories.map(c => (
              <Button key={c.id} size="sm" variant={catFilter === c.id ? "default" : "outline"} onClick={() => setCatFilter(c.id)}>{c.name}</Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex flex-col items-center rounded-xl border bg-card p-3 text-center transition-all hover:shadow-md hover:border-primary/50 active:scale-95"
              >
                <img src={getProductImage(p)} alt={p.name} className="mb-2 h-20 w-20 rounded-lg object-cover" loading="lazy" />
                <span className="text-sm font-medium text-foreground line-clamp-1">{p.name}</span>
                <span className="text-sm font-bold text-primary">Rp {p.price.toLocaleString("id-ID")}</span>
                <span className="text-xs text-muted-foreground">Stok: {p.stock}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <Card className="flex w-full flex-col lg:w-80 xl:w-96">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />Keranjang ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Keranjang kosong</p>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 rounded-lg border p-2">
                  <img src={getProductImage(item.product)} alt={item.product.name} className="h-10 w-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t pt-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">Rp {total.toLocaleString("id-ID")}</span>
            </div>
            <Button className="w-full gap-2" size="lg" disabled={cart.length === 0} onClick={handlePayClick}>
              <Banknote className="h-4 w-4" />Bayar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog - Input uang tunai */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />Pembayaran Tunai
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Total yang harus dibayar</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(total)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash-input">Uang Diterima</Label>
              <Input
                ref={cashInputRef}
                id="cash-input"
                type="number"
                placeholder="Masukkan jumlah uang..."
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmPayment()}
                className="text-lg font-semibold"
              />
            </div>
            {cashInput && parseInt(cashInput.replace(/\D/g, ""), 10) >= total && (
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Kembalian</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(parseInt(cashInput.replace(/\D/g, ""), 10) - total)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>Batal</Button>
<<<<<<< HEAD
            <Button className="gap-2" onClick={confirmPayment}>
=======
            <Button className="gap-2" onClick={confirmPayment} disabled={submitting}>
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
              <Check className="h-4 w-4" />Konfirmasi Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog - Struk transaksi */}
      <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />Struk Transaksi
            </DialogTitle>
          </DialogHeader>
          {completedSale && (
            <div id="pos-receipt" className="space-y-3 rounded-lg border bg-card p-4 font-mono text-sm">
              <div className="text-center">
                <p className="text-base font-bold">Warung Mama Eva</p>
                <p className="text-xs text-muted-foreground">Struk Pembayaran</p>
                <p className="text-xs text-muted-foreground">{formatDate(completedSale.createdAt)}</p>
                <p className="text-xs text-muted-foreground">#{completedSale.orderId.slice(0, 8)}</p>
              </div>
              <div className="border-t border-dashed" />
              {completedSale.items.map(item => (
                <div key={item.product.id}>
                  <div className="flex justify-between">
                    <span className="flex-1">{item.product.name}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{item.quantity} x {formatCurrency(item.product.price)}</span>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-dashed" />
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>{formatCurrency(completedSale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tunai</span>
                <span>{formatCurrency(completedSale.cashReceived)}</span>
              </div>
              <div className="flex justify-between font-bold text-primary">
                <span>Kembalian</span>
                <span>{formatCurrency(completedSale.change)}</span>
              </div>
              <div className="border-t border-dashed" />
              <p className="text-center text-xs text-muted-foreground">Terima kasih atas kunjungan Anda!</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="gap-2" onClick={printReceipt}>
              <Printer className="h-4 w-4" />Cetak Struk
            </Button>
            <Button onClick={() => setCompletedSale(null)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPOS;
