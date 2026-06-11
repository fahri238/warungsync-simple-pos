import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  getProductsFromAPI,
  getCategoriesFromAPI,
  getProductImage,
  DEFAULT_STORE_ID,
} from "@/lib/store";
import { fetchProductByBarcode } from "@/services/productService";
import type { Product, OrderItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  Banknote,
  Printer,
  Barcode,
  PackageOpen,
  Wallet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/services/orderService";

interface CompletedSale {
  orderId: string;
  items: OrderItem[];
  total: number;
  cashReceived: number;
  change: number;
  createdAt: string;
}

const AdminPOS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [loading, setLoading] = useState(true); 
  const storeId = DEFAULT_STORE_ID;

  // Payment flow
  const [showPayment, setShowPayment] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const cashInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Receipt
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(
    null,
  );

  useEffect(() => {
    setLoading(true); // start loading
    Promise.all([getProductsFromAPI(storeId), getCategoriesFromAPI(storeId)])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => {
        toast.error("Gagal memuat data POS");
      })
      .finally(() => {
        setLoading(false); // end loading if it's either success or failed
      });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      return matchSearch && matchCat && p.stock > 0;
    });
  }, [products, search, catFilter]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [cart],
  );

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error("Stok tidak cukup");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id === id) {
          const newQty = i.quantity + delta;
          if (newQty <= 0) return i;
          if (newQty > i.product.stock) {
            toast.error("Stok maksimal tercapai");
            return i;
          }
          return { ...i, quantity: newQty };
        }
        return i;
      }),
    );
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== id));

  // Step 1: Click "Bayar" → open payment dialog
  const handlePayClick = () => {
    if (cart.length === 0) return;
    setCashInput("");
    setShowPayment(true);
    setTimeout(() => cashInputRef.current?.focus(), 100);
  };

  // Step 2: Confirm payment with cash amount
  const confirmPayment = async () => {
    const cash = parseInt(cashInput.replace(/\D/g, ""), 10);
    if (!cash || cash < total) {
      toast.error("Nominal uang tunai kurang dari total belanja!");
      return;
    }

    const change = cash - total;
    const createdAt = new Date().toISOString();

    try {
      setSubmitting(true);
      const response = await createOrder({
        storeId,
        customerName: "Pelanggan Toko (Walk-in)",
        customerPhone: "-",
        type: "pos",
        fulfillment: "pickup",
        paymentMethod: "cash",
        status: "completed",
        items: cart,
      });
      const orderId =
        response?.data?.id || `POS-${Date.now().toString().slice(-6)}`;

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
          return {
            ...product,
            stock: Math.max(0, product.stock - cartItem.quantity),
          };
        }),
      );
      toast.success("Transaksi kasir berhasil!");
    } catch (error: any) {
      toast.error(error?.message || "Transaksi gagal diproses");
    } finally {
      setSubmitting(false);
    }
  };

  // Print receipt
  // Print receipt (Diperbarui agar setara dengan fitur cetak lainnya)
  const printReceipt = () => {
    if (!completedSale) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    // Build the items list HTML
    const itemsHtml = completedSale.items
      .map(
        (i) => `
      <div class="row">
        <span class="item-name">${i.product?.name || "Produk"}</span>
      </div>
      <div class="row" style="color: #444; font-size: 11px;">
        <span>${i.quantity} x ${formatCurrency(i.product?.price)}</span>
        <span class="bold">${formatCurrency(i.product?.price * i.quantity)}</span>
      </div>
    `,
      )
      .join("");

    const formattedDate = formatDate(completedSale.createdAt);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pembelian #${completedSale.orderId.slice(-6)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            width: 80mm; 
            margin: 0 auto; 
            padding: 15px; 
            color: #000; 
            box-sizing: border-box;
          }
          @media screen {
            body { 
              background-color: white; 
              border: 1px solid #ccc; 
              box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
              margin-top: 20px; 
              min-height: 200px; 
            }
            html { background-color: #f0f0f0; }
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .item-name { font-weight: bold; word-break: break-word; }
          .title { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase;}
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">WARUNG MAMA EVA</div>
          <div style="font-size: 11px; margin-top: 4px;">STRUK PEMBELIAN KASIR (POS)</div>
          <div style="color: #333; font-size: 10px; margin-top: 4px;">${formattedDate}</div>
          <div style="color: #333; font-size: 10px; margin-top: 2px;">Order ID: #${completedSale.orderId.slice(0, 8).toUpperCase()}</div>
        </div>
        
        <div class="divider"></div>
        <div>Customer: <span class="bold">Walk-in</span></div>
        <div>Kasir: <span class="bold">Admin</span></div>
        
        <div class="divider"></div>
        ${itemsHtml}
        
        <div class="divider"></div>
        <div class="row bold" style="font-size: 14px; margin-top: 5px;">
          <span>TOTAL</span>
          <span>${formatCurrency(completedSale.total)}</span>
        </div>
        <div class="row" style="margin-top: 5px;">
          <span>Tunai Diterima</span>
          <span>${formatCurrency(completedSale.cashReceived)}</span>
        </div>
        <div class="row bold">
          <span>Kembalian</span>
          <span>${formatCurrency(completedSale.change)}</span>
        </div>
        
        <div class="divider"></div>
        <div class="center" style="margin-top: 15px; font-size: 10px; color: #333;">
          Terima kasih atas kunjungan Anda!<br/>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " • " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    let product = products.find((p) => p.barcode === code);
    if (!product) {
      try {
        const fromApi = await fetchProductByBarcode(storeId, code);
        if (fromApi) {
          product = fromApi;
          setProducts((prev) =>
            prev.some((p) => p.id === fromApi.id) ? prev : [...prev, fromApi],
          );
        }
      } catch {
        toast.error("Barcode tidak terdaftar");
        return;
      }
    }

    if (product) {
      addToCart(product);
      setBarcodeInput("");
      toast.success(`${product.name} masuk keranjang`);
    } else {
      toast.error("Produk tidak ditemukan di database");
    }
  };

  // Quick Amount Buttons untuk Kasir
  const quickAmounts = [
    total,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      {/* KIRI: Area Pencarian & Grid Produk */}
      <div className="flex flex-1 flex-col gap-5 overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 border border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background/50 focus-visible:bg-background"
              />
            </div>
            <form onSubmit={handleBarcodeSubmit} className="sm:w-64 relative">
              <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Scan Barcode (Enter)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoComplete="off"
                className="pl-9 h-11 font-mono text-sm bg-background/50 focus-visible:bg-background"
              />
            </form>
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
            <Button
              size="sm"
              variant={catFilter === "all" ? "default" : "secondary"}
              className="rounded-full px-4"
              onClick={() => setCatFilter("all")}
            >
              Semua
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={catFilter === c.id ? "default" : "secondary"}
                className="rounded-full px-4 whitespace-nowrap"
                onClick={() => setCatFilter(c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid Layout */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            // show Loading Spinner
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Memuat Katalog Produk...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            // show empty (if only loading end)
            <div className="flex h-full flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/60 rounded-3xl bg-card/30">
              <PackageOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-bold text-foreground">
                Barang tidak ditemukan
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Coba sesuaikan kata kunci atau filter kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 content-start pb-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group flex flex-col relative overflow-hidden rounded-2xl border border-border/50 bg-card p-3 text-left transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 active:scale-95"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted mb-3 relative">
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-foreground shadow-sm">
                      Sisa {p.stock}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {p.name}
                  </span>

                  {/* Wrapper price & Barcode */}
                  <div className="mt-auto pt-2 w-full flex flex-col items-start">
                    <span className="text-sm font-black text-primary">
                      Rp {p.price.toLocaleString("id-ID")}
                    </span>
                    {p.barcode ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded mt-1.5 border border-border/50">
                        <Barcode className="h-3 w-3" /> {p.barcode}
                      </div>
                    ) : (
                      <div className="h-6 mt-1.5"></div> /* Placeholder space guard */
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Panel Cashier Cart */}
      <Card className="flex w-full flex-col lg:w-[380px] xl:w-[420px] shrink-0 border-border/50 shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-card/50 backdrop-blur-sm pb-4 pt-5 px-6">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Pesanan Saat Ini
            </div>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)} Item
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-0 p-0 overflow-hidden bg-background/50">
          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center opacity-50">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Belum ada barang di keranjang
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Pilih produk atau scan barcode untuk memulai transaksi.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-all hover:border-primary/30"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={getProductImage(item.product)}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      Rp{" "}
                      {(item.product.price * item.quantity).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                  <div className="flex items-center bg-secondary/20 rounded-lg border border-border/50 p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md hover:bg-background"
                      onClick={() => updateQty(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md hover:bg-background"
                      onClick={() => updateQty(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Bottom Area */}
          <div className="border-t border-border/50 bg-card p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
            <div className="mb-4 flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-4">
              <span className="text-sm font-bold text-foreground">
                Total Tagihan
              </span>
              <span className="text-2xl font-black text-primary tracking-tight">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
            <Button
              className="w-full h-14 text-lg gap-2 shadow-xl shadow-primary/20 rounded-xl"
              disabled={cart.length === 0}
              onClick={handlePayClick}
            >
              <Wallet className="h-5 w-5" /> Proses Pembayaran
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog 1: process payment at cashier */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="bg-primary/5 p-6 text-center border-b border-primary/10">
            <p className="text-sm font-semibold text-primary mb-1 uppercase tracking-wider">
              Total Harus Dibayar
            </p>
            <p className="text-4xl font-black text-foreground tracking-tight">
              {formatCurrency(total)}
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <Label
                htmlFor="cash-input"
                className="text-muted-foreground text-xs uppercase tracking-wider font-bold"
              >
                Uang Tunai Diterima
              </Label>
              <div className="relative">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={cashInputRef}
                  id="cash-input"
                  type="number"
                  placeholder="Ketik nominal uang (Rp)"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmPayment()}
                  className="pl-12 h-14 text-xl font-bold bg-muted/30 border-border/80 focus-visible:ring-primary"
                />
              </div>

              {/* hotkeys nominal amount */}
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    className="flex-1 border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold"
                    onClick={() => setCashInput(amount.toString())}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>

            {/* change calculation */}
            {cashInput &&
              parseInt(cashInput.replace(/\D/g, ""), 10) >= total && (
                <div className="rounded-xl border border-success/30 bg-success/10 p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-sm font-bold text-success-foreground flex items-center gap-2">
                    <Check className="h-4 w-4" /> Uang Kembalian
                  </span>
                  <span className="text-xl font-black text-success">
                    {formatCurrency(
                      parseInt(cashInput.replace(/\D/g, ""), 10) - total,
                    )}
                  </span>
                </div>
              )}
          </div>

          <DialogFooter className="bg-muted/30 p-4 border-t border-border/50 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPayment(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              className="flex-1 gap-2 shadow-md shadow-primary/20"
              onClick={confirmPayment}
              disabled={submitting}
            >
              {submitting ? (
                "Memproses..."
              ) : (
                <>
                  <Check className="h-4 w-4" /> Konfirmasi Bayar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 2:  transaction complete receipt */}
      <Dialog
        open={!!completedSale}
        onOpenChange={() => setCompletedSale(null)}
      >
        <DialogContent className="sm:max-w-[360px] p-0 rounded-2xl overflow-hidden border-border/50">
          <div className="bg-primary p-6 text-center text-primary-foreground">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Transaksi Berhasil!</h3>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Kembalian:{" "}
              {completedSale ? formatCurrency(completedSale.change) : ""}
            </p>
          </div>

          <div className="px-6 py-4 bg-muted/20">
            {completedSale && (
              <div
                id="pos-receipt"
                className="rounded-xl bg-white p-4 shadow-sm border font-mono text-xs text-black"
              >
                <div className="text-center mb-3">
                  <p className="text-sm font-bold uppercase tracking-widest">
                    Warung Mama Eva
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Struk Pembelian Kasir
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formatDate(completedSale.createdAt)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Order ID: #{completedSale.orderId.slice(0, 8)}
                  </p>
                </div>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="space-y-1.5 my-2">
                  {completedSale.items.map((item) => (
                    <div key={item.product.id}>
                      <div className="font-semibold truncate">
                        {item.product.name}
                      </div>
                      <div className="flex justify-between text-gray-600 mt-0.5">
                        <span>
                          {item.quantity} x {formatCurrency(item.product.price)}
                        </span>
                        <span>
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="flex justify-between font-bold text-sm my-1">
                  <span>TOTAL</span>
                  <span>{formatCurrency(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600 my-1">
                  <span>Tunai</span>
                  <span>{formatCurrency(completedSale.cashReceived)}</span>
                </div>
                <div className="flex justify-between font-bold my-1">
                  <span>Kembali</span>
                  <span>{formatCurrency(completedSale.change)}</span>
                </div>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <p className="text-center text-[10px] text-gray-500 mt-3">
                  Terima kasih atas kunjungan Anda!
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-background border-t gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary"
              onClick={printReceipt}
            >
              <Printer className="h-4 w-4" /> Cetak Struk
            </Button>
            <Button className="w-full" onClick={() => setCompletedSale(null)}>
              Transaksi Baru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPOS;
