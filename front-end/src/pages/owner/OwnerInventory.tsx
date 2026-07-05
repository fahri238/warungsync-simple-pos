import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProductImage, getSession, apiFetch } from "@/lib/store";
import { updateProductInAPI } from "@/lib/store"; // Fungsi yang sudah kita buat sebelumnya
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert, Loader2, PackageOpen, ArrowUpRight, ArrowDownRight, Save } from "lucide-react";

const OwnerInventory = () => {
  const session = getSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk modal penyesuaian
  const [adjustingProd, setAdjustingProd] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number | "">("");
  const [adjustReason, setAdjustReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Ambil data produk berdasarkan Store ID
  const fetchInventory = async () => {
    if (!session?.store_id) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/products?storeId=${session.store_id}`);
      setProducts(res.data || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat inventaris");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.role === "owner" && session.store_id) {
      fetchInventory();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.store_id, session?.role]);

  // Eksekusi penyesuaian stok ke Database
  const handleAdjust = async () => {
    if (!adjustingProd || adjustQty === "" || Number(adjustQty) === 0) {
      toast.error("Masukkan jumlah penyesuaian yang valid");
      return;
    }

    const qty = Number(adjustQty);
    const newStock = Math.max(0, adjustingProd.stock + qty);

    try {
      setSaving(true);
      // Panggil API update produk untuk menimpa field stok
      await updateProductInAPI(adjustingProd.id, {
        name: adjustingProd.name,
        price: adjustingProd.price,
        stock: newStock,
        category: adjustingProd.category,
        barcode: adjustingProd.barcode || "",
        image: adjustingProd.image || "",
        description: adjustingProd.description || "",
      });

      // Update tampilan tabel secara lokal tanpa perlu refresh API jika berhasil
      setProducts((prev) =>
        prev.map((p) => (p.id === adjustingProd.id ? { ...p, stock: newStock } : p))
      );

      // Reset Modal
      setAdjustingProd(null);
      setAdjustQty("");
      setAdjustReason("");
      
      toast.success(`Stok ${adjustingProd.name} berhasil diperbarui menjadi ${newStock}`);
    } catch (error: any) {
      toast.error("Gagal menyesuaikan stok");
    } finally {
      setSaving(false);
    }
  };

  const openAdjustModal = (product: Product) => {
    setAdjustingProd(product);
    setAdjustQty("");
    setAdjustReason("");
  };

  // PENGECEKAN KEAMANAN UNTUK OWNER
  if (!session || session.role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/10 px-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-sm text-center shadow-2xl border-0 rounded-[2rem] overflow-hidden relative">
          <div className="h-2 bg-destructive w-full absolute top-0 left-0"></div>
          <CardContent className="py-12">
            <div className="mx-auto h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/5">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-foreground">Akses Ditolak</h2>
            <p className="mb-8 text-muted-foreground text-sm px-4">
              Sesi pemilik warung (owner) Anda tidak ditemukan atau Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <Button asChild className="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20">
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Memeriksa Brankas Inventori...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventaris Stok</h2>
          <p className="text-sm text-muted-foreground mt-1">Pantau dan kelola ketersediaan fisik barang toko Anda.</p>
        </div>
        <Button onClick={fetchInventory} variant="outline" size="sm" className="gap-2">
           Perbarui Data
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
             <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
               <PackageOpen className="h-10 w-10 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-bold text-foreground">Inventaris Kosong</h3>
             <p className="text-sm text-muted-foreground mt-1 max-w-sm">
               Belum ada barang yang didaftarkan. Tambahkan barang melalui menu Produk.
             </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4 text-center">Jumlah Stok</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-background">
                          <img 
                            src={getProductImage(p)} 
                            alt={p.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{p.name}</span>
                          {p.barcode && <span className="font-mono text-[10px] text-muted-foreground mt-0.5">{p.barcode}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-base font-bold text-foreground bg-background border border-border/50 px-3 py-1 rounded-md">
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        p.stock === 0 ? "bg-destructive/10 text-destructive border border-destructive/20" :
                        p.stock <= 10 ? "bg-orange-500/10 text-orange-600 border border-orange-500/20" :
                        "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {p.stock === 0 ? "Habis" : p.stock <= 10 ? "Menipis" : "Aman"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="shadow-sm"
                        onClick={() => openAdjustModal(p)}
                      >
                        Penyesuaian
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Penyesuaian Stok */}
      <Dialog open={!!adjustingProd} onOpenChange={(open) => !open && setAdjustingProd(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden p-0">
          <DialogHeader className="bg-muted/30 p-6 border-b border-border/50">
            <DialogTitle>Sesuaikan Fisik Stok</DialogTitle>
            <DialogDescription className="mt-1">
              {adjustingProd?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
               <span className="text-sm font-semibold text-primary">Stok Saat Ini Tercatat:</span>
               <span className="text-2xl font-black text-primary">{adjustingProd?.stock}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>Jumlah Perubahan</span>
                  <span className="text-xs text-muted-foreground font-normal">Gunakan (-) untuk mengurangi</span>
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="Contoh: 10 atau -5" 
                    value={adjustQty} 
                    onChange={e => setAdjustQty(e.target.value ? Number(e.target.value) : "")} 
                    className="h-12 font-mono text-lg font-bold bg-background pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex flex-col -gap-1">
                     {Number(adjustQty) > 0 ? <ArrowUpRight className="h-5 w-5 text-success" /> : Number(adjustQty) < 0 ? <ArrowDownRight className="h-5 w-5 text-destructive" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30"></div>}
                  </div>
                </div>
                
                {adjustQty !== "" && (
                  <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
                    Hasil Akhir Stok: <span className="font-bold text-foreground text-sm bg-muted px-2 py-0.5 rounded">{Math.max(0, (adjustingProd?.stock || 0) + Number(adjustQty))}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Alasan Penyesuaian <span className="text-destructive">*</span></Label>
                <Input 
                  placeholder="Contoh: Barang datang dari supplier, Kadaluarsa, dll." 
                  value={adjustReason} 
                  onChange={e => setAdjustReason(e.target.value)} 
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/30 p-4 border-t border-border/50 flex gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setAdjustingProd(null)} disabled={saving} className="w-full sm:flex-1">
              Batal
            </Button>
            <Button onClick={handleAdjust} disabled={saving || !adjustReason || adjustQty === ""} className="w-full sm:flex-1 gap-2 shadow-md shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerInventory;