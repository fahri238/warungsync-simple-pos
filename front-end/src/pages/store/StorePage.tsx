import { useState, useMemo, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  getProductsFromAPI,
  getCategoriesFromAPI,
  getCart,
  saveCart,
  getProductImage,
  getSession,
  clearOtherStoreCarts,
} from "@/lib/store";
import { fetchStoreById } from "@/services/storeService";
import { useStoreContext } from "@/context/StoreContext";
import type { OrderItem, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Plus, User, Loader2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { setSelectedStore } = useStoreContext();
  const session = getSession();

  if (!storeId) {
    return <Navigate to="/stores" replace />;
  }

  const [storeName, setStoreName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<OrderItem[]>(() => getCart(storeId));
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    clearOtherStoreCarts(storeId);
    fetchStoreById(storeId)
      .then((s) => {
        setStoreName(s.name);
        setSelectedStore(s);
      })
      .catch(() => setStoreName("Toko"));
  }, [storeId, setSelectedStore]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prods, cats] = await Promise.all([
          getProductsFromAPI(storeId),
          getCategoriesFromAPI(storeId),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch {
        toast.error("Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [storeId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      toast.error(`Mohon maaf, ${p.name} sedang habis.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      let updated: OrderItem[];
      
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error(`Sisa stok ${p.name} hanya ${p.stock} buah.`);
          return prev;
        }
        
        updated = prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
        toast.success(`${p.name} ditambahkan ke keranjang`);
      } else {
        updated = [...prev, { product: p, quantity: 1 }];
        toast.success(`${p.name} ditambahkan ke keranjang`);
      }
      
      saveCart(storeId, updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <Link to="/stores" className="text-xs text-muted-foreground hover:text-foreground">
              Ganti toko
            </Link>
            <span className="truncate font-bold text-foreground">{storeName || "Toko"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/store/${storeId}/orders`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Pesanan
            </Link>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link to={`/store/${storeId}/cart`}>
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
            {session ? (
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link
                  to={
                    session.role === "admin"
                      ? "/admin"
                      : session.role === "courier"
                        ? "/courier"
                        : "/customer"
                  }
                >
                  <User className="h-4 w-4" />
                  {session.name}
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Masuk</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <p className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          Belanja hanya dari toko ini — keranjang tidak bisa mencampur toko lain.
        </p>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {!loading && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                size="sm"
                variant={catFilter === "all" ? "default" : "outline"}
                onClick={() => setCatFilter("all")}
              >
                Semua
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={catFilter === c.id ? "default" : "outline"}
                  onClick={() => setCatFilter(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p) => {
              const itemInCart = cart.find(i => i.product.id === p.id);
              const qtyInCart = itemInCart ? itemInCart.quantity : 0;
              
              // LOGIKA BARU: Hitung sisa stok yang benar-benar bisa dibeli
              const availableStock = Math.max(0, p.stock - qtyInCart);
              
              const isMaxedOut = availableStock <= 0 && p.stock > 0;
              const isOutOfStock = p.stock === 0;

              return (
                <div
                  key={p.id}
                  className={`group relative overflow-hidden rounded-xl border bg-card transition-all ${isOutOfStock ? 'opacity-70 grayscale-[50%]' : 'hover:shadow-md'}`}
                >
                  <div className="absolute top-2 left-2 z-10">
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 rounded-md bg-destructive/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                        <AlertCircle className="h-3 w-3" /> Habis
                      </span>
                    ) : (
                      <span className={`rounded-md px-2 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm ${availableStock <= 0 ? 'bg-destructive/90 text-white' : availableStock <= 5 ? 'bg-orange-500/90 text-white' : 'bg-background/90 text-foreground border border-border/50'}`}>
                        {availableStock <= 0 ? 'Maksimal' : `Sisa: ${availableStock}`}
                      </span>
                    )}
                  </div>

                  <div className="aspect-square bg-muted relative">
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-semibold text-foreground line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-sm font-bold ${isOutOfStock ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                      
                      <Button 
                        size="icon" 
                        className={`h-8 w-8 transition-colors ${isMaxedOut || isOutOfStock ? 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed' : ''}`}
                        onClick={() => addToCart(p)}
                        disabled={isMaxedOut || isOutOfStock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Tidak ada produk ditemukan.
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;