import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getCart, saveCart, getProductImage } from "@/lib/store";
import type { OrderItem } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner"; 

const CustomerCart = () => {
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) {
    // FIX ROUTE
    return <Navigate to="/customer/stores" replace />;
  }

  const [cart, setCart] = useState<OrderItem[]>(() => getCart(storeId));
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const updateQty = (id: string, delta: number) => {
    const item = cart.find(i => i.product.id === id);
    if (item && delta > 0 && item.quantity >= item.product.stock) {
      toast.error(`Maksimal pembelian tercapai! Sisa stok hanya ${item.product.stock} barang.`);
      return;
    }

    setCart((prev) => {
      const updated = prev.map((i) => {
        if (i.product.id === id) {
          const newQty = i.quantity + delta;
          if (newQty <= 0) return i;
          return { ...i, quantity: newQty };
        }
        return i;
      });
      saveCart(storeId, updated);
      return updated;
    });
  };

  const remove = (id: string) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.product.id !== id);
      saveCart(storeId, updated);
      return updated;
    });
    toast.success("Barang dihapus dari keranjang");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" asChild>
            {/* FIX ROUTE */}
            <Link to={`/customer/store/${storeId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-bold text-foreground">Keranjang ({cart.length})</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6">
        {cart.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Keranjang kosong</p>
            <Button className="mt-4" asChild>
              {/* FIX ROUTE */}
              <Link to={`/customer/store/${storeId}`}>Mulai Belanja</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.product.name}</p>
                    <p className="text-sm font-bold text-primary">
                      Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(item.product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold text-foreground">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>
              <Button className="mt-4 w-full" size="lg" asChild>
                {/* FIX ROUTE */}
                <Link to={`/customer/store/${storeId}/checkout`}>Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerCart;