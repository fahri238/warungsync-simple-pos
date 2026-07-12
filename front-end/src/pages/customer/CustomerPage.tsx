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
import {
  Search,
  ShoppingCart,
  Plus,
  User,
  Loader2,
  MapPin,
  AlertCircle,
  Minus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const CustomerPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { setSelectedStore } = useStoreContext();
  const session = getSession();

  if (!storeId) {
    return <Navigate to="/customer/stores" replace />;
  }

  const [storeName, setStoreName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
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

  // Fungsi Tambah Barang
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
        // Toast dimatikan saat increment agar tidak spam ketika ditekan berkali-kali
      } else {
        updated = [...prev, { product: p, quantity: 1 }];
        toast.success(`${p.name} ditambahkan ke keranjang`);
      }

      saveCart(storeId, updated);
      return updated;
    });
  };

  // Fungsi Kurangi Barang (BARU)
  const decreaseCartQty = (productId: string | number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;

      let updated: OrderItem[];

      if (existing.quantity > 1) {
        updated = prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      } else {
        updated = prev.filter((i) => i.product.id !== productId);
      }

      saveCart(storeId, updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <Link
              to="/customer/stores"
              className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            >
              &larr; Ganti toko
            </Link>
            <span className="truncate font-bold text-foreground text-sm sm:text-base">
              {storeName || "Toko"}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to={`/customer/store/${storeId}/orders`}>Pesanan</Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border/80 shadow-sm"
              asChild
            >
              <Link to={`/customer/store/${storeId}/cart`}>
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 shadow-sm"
              asChild
            >
              <Link to="/customer">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {session?.name?.split(" ")[0] || "Profil"}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-3 flex gap-2 items-start">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Anda sedang berbelanja di{" "}
            <span className="font-semibold text-foreground">{storeName}</span>.
            Keranjang bersifat eksklusif dan tidak bisa digabung dengan produk
            dari toko lain.
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="relative shadow-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari menu atau produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-card border-border/80 focus-visible:ring-primary/20"
            />
          </div>
          {!loading && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <Button
                size="sm"
                variant={catFilter === "all" ? "default" : "outline"}
                onClick={() => setCatFilter("all")}
                className="rounded-full shadow-sm"
              >
                Semua Menu
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={catFilter === c.id ? "default" : "outline"}
                  onClick={() => setCatFilter(c.id)}
                  className="rounded-full shadow-sm whitespace-nowrap bg-card"
                >
                  {c.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              Menyiapkan etalase toko...
            </p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p) => {
              const itemInCart = cart.find((i) => i.product.id === p.id);
              const qtyInCart = itemInCart ? itemInCart.quantity : 0;
              const availableStock = Math.max(0, p.stock - qtyInCart);
              const isMaxedOut = availableStock <= 0 && p.stock > 0;
              const isOutOfStock = p.stock === 0;

              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 ${isOutOfStock ? "opacity-70 grayscale-[30%]" : "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 shadow-sm"}`}
                >
                  {/* Label Stok di Kiri Atas */}
                  <div className="absolute top-2 left-2 z-10">
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 rounded-md bg-destructive/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                        <AlertCircle className="h-3 w-3" /> Habis
                      </span>
                    ) : (
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md ${availableStock <= 0 ? "bg-destructive/90 text-white" : availableStock <= 5 ? "bg-orange-500/90 text-white" : "bg-background/80 text-foreground border border-border/50"}`}
                      >
                        {availableStock <= 0
                          ? "Maksimal"
                          : `Sisa ${availableStock}`}
                      </span>
                    )}
                  </div>

                  {/* Gambar Produk */}
                  <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Detail & Aksi */}
                  <div className="flex flex-1 flex-col p-3.5">
                    <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                        {p.description}
                      </p>
                    )}

                    <div className="mt-auto pt-3 flex items-center justify-between gap-1">
                      <span
                        className={`font-black text-sm tracking-tight ${isOutOfStock ? "text-muted-foreground line-through" : "text-primary"}`}
                      >
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>

                      {/* REDESIGN: Kontrol Kuantitas (+ & -) */}
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg border border-border/60 p-0.5 shadow-inner">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            onClick={() => decreaseCartQty(p.id)}
                          >
                            {qtyInCart === 1 ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <span className="text-xs font-bold w-5 text-center text-foreground">
                            {qtyInCart}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 rounded-md transition-colors ${isMaxedOut ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/15 hover:text-primary"}`}
                            onClick={() => addToCart(p)}
                            disabled={isMaxedOut}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          className={`h-8 w-8 rounded-lg shadow-sm transition-all duration-300 ${isOutOfStock ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-primary/20"}`}
                          onClick={() => addToCart(p)}
                          disabled={isOutOfStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-3xl bg-card/50 mt-4">
            <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">
              Tidak ada produk ditemukan.
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Coba gunakan kata kunci lain atau pilih kategori Semua Menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPage;
