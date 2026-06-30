import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getProductsFromAPI,
  getCategoriesFromAPI,
  getCart,
  saveCart,
  getProductImage,
  getSession,
} from "@/lib/store";
import type { OrderItem, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Plus, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const StorePage = () => {
  const session = getSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<OrderItem[]>(getCart);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  // Load products and categories on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        getProductsFromAPI(),
        getCategoriesFromAPI(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      return matchSearch && matchCat && p.stock > 0;
    });
  }, [products, search, catFilter]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      let updated: OrderItem[];
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error("Stok tidak cukup");
          return prev;
        }
        updated = prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        updated = [...prev, { product: p, quantity: 1 }];
      }
      saveCart(updated);
      return updated;
    });
    toast.success("Ditambahkan ke keranjang");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <span className="font-bold text-foreground">Warung Mama Eva</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/store/orders"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Pesanan
            </Link>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link to="/store/cart">
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
        {/* Search & Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari makanan atau minuman..."
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Product Grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
              >
                <div className="aspect-square bg-muted">
                  <img
                    src={getProductImage(p)}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {p.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      Rp {p.price.toLocaleString("id-ID")}
                    </span>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => addToCart(p)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
