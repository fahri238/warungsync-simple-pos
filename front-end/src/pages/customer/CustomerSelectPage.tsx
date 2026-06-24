import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { fetchStores, type Store } from "@/services/storeService";
import { useStoreContext } from "@/context/StoreContext";
import StoreMap from "@/components/maps/StoreMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Store as StoreIcon, Loader2, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/store";

const CustomerSelectPage = () => {
  const navigate = useNavigate();
  const { setSelectedStore } = useStoreContext();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const session = getSession();

  useEffect(() => {
    fetchStores()
      .then(setStores)
      .catch(() => toast.error("Gagal memuat daftar toko"))
      .finally(() => setLoading(false));
  }, []);

  const chooseStore = (store: Store) => {
    setSelectedStore(store);
    // PERBAIKAN RUTE: Mengarah ke dalam payung /customer
    navigate(`/customer/store/${store.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          {/* PERBAIKAN RUTE: Logo mengarah ke dashboard customer */}
          <Link to="/customer">
            <WarungSyncLogo size="sm" />
          </Link>
          <Button variant="outline" size="sm" asChild>
            {/* PERBAIKAN RUTE: Tombol diubah menjadi Profil karena user pasti sudah login */}
            <Link to="/customer" className="gap-2">
              <User className="h-4 w-4" /> {session?.name?.split(" ")[0] || "Profil"}
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Pilih Toko</h1>
          <p className="mt-2 text-muted-foreground">
            Pilih satu toko terlebih dahulu. Keranjang hanya berisi produk dari toko yang sama.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <StoreMap stores={stores} onSelectStore={chooseStore} height="360px" />

            <div className="grid gap-3 sm:grid-cols-2">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => chooseStore(store)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <StoreIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{store.name}</h3>
                      {store.address && (
                        <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{store.address}</span>
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerSelectPage;