import { useState, useMemo, useCallback } from "react";
import { getProducts, getCategories, reduceStock, addOrder, generateId } from "@/lib/store";
import type { Product, CartItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Trash2, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

const AdminPOS = () => {
  const [products] = useState(getProducts);
  const categories = getCategories();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

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
        if (existing.quantity >= p.stock) {
          toast.error("Stok tidak cukup");
          return prev;
        }
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

  const completeSale = () => {
    if (cart.length === 0) return;
    reduceStock(cart);
    addOrder({
      id: generateId(),
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
    setCart([]);
    toast.success("Transaksi berhasil!");
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
            <Button size="sm" variant={catFilter === "all" ? "default" : "outline"} onClick={() => setCatFilter("all")}>
              Semua
            </Button>
            {categories.map(c => (
              <Button key={c.id} size="sm" variant={catFilter === c.id ? "default" : "outline"} onClick={() => setCatFilter(c.id)}>
                {c.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex flex-col items-center rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md hover:border-primary/50 active:scale-95"
              >
                <span className="mb-2 text-4xl">{p.image}</span>
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
            <ShoppingCart className="h-4 w-4" />
            Keranjang ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Keranjang kosong</p>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 rounded-lg border p-2">
                  <span className="text-2xl">{item.product.image}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
            <Button className="w-full gap-2" size="lg" disabled={cart.length === 0} onClick={completeSale}>
              <Check className="h-4 w-4" />
              Bayar (Cash)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPOS;
