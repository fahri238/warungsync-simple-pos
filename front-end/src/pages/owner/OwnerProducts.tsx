import { useState, useEffect, useMemo } from "react";
import {
  getProductsFromAPI,
  getCategoriesFromAPI,
  addProductToAPI,
  updateProductInAPI,
  deleteProductFromAPI,
  addCategoryToAPI,
  deleteCategoryFromAPI,
  getProductImage,
  getSession,
} from "@/lib/store";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  ImageIcon,
  Loader2,
  Package,
  Barcode,
  Banknote,
  Boxes,
  Search,
  AlertCircle,
  Layers,
  Eye,
  X,
  CheckCheck,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// PERBAIKAN: Mendefinisikan tipe form secara lokal agar TypeScript mengenali capitalPrice
interface ProductFormState {
  name: string;
  price: number;
  capitalPrice: number;
  stock: number;
  category: string;
  barcode: string;
  image: string;
  description: string;
}

const emptyProduct: ProductFormState = {
  name: "",
  price: 0,
  capitalPrice: 0,
  stock: 0,
  category: "",
  barcode: "",
  image: "",
  description: "",
};

const OwnerProducts = () => {
  const session = getSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProduct);
  const [imagePreview, setImagePreview] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.store_id]);

  useEffect(() => {
    if (form.image && form.image.length > 5) {
      setImagePreview(form.image);
    } else {
      setImagePreview("");
    }
  }, [form.image]);

  const loadData = async () => {
    if (!session || !session.store_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const storeIdStr = session.store_id.toString();
      const [prods, cats] = await Promise.all([
        getProductsFromAPI(storeIdStr),
        getCategoriesFromAPI(storeIdStr),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Gagal memuat data. Pastikan backend berjalan di http://localhost:5000";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyProduct);
    setImagePreview("");
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      // PERBAIKAN: Mengambil capitalPrice dari database (gunakan fallback ke 0 jika kosong)
      capitalPrice: (p as any).capitalPrice || 0, 
      stock: p.stock,
      category: p.category,
      barcode: p.barcode || "",
      image: p.image || "",
      description: p.description || "",
    });
    setImagePreview(p.image || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Tambahan validasi: Harga Jual sebaiknya tidak lebih kecil dari Harga Modal
    if (!form.name || !form.category || form.price <= 0) {
      toast.error("Lengkapi nama, kategori, dan harga jual");
      return;
    }
    
    if (form.capitalPrice > form.price) {
      toast.error("Peringatan: Harga Modal lebih besar dari Harga Jual!");
      return;
    }

    try {
      setSaving(true);
      // Data yang dikirim sekarang sudah mengandung capitalPrice
      if (editing) {
        await updateProductInAPI(editing.id, form);
        toast.success("Produk diperbarui");
      } else {
        await addProductToAPI(form);
        toast.success("Produk ditambahkan");
      }
      await loadData();
      setDialogOpen(false);
    } catch {
      toast.error("Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductFromAPI(id);
      toast.success("Produk dihapus");
      await loadData();
    } catch {
      toast.error("Gagal menghapus produk");
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setSaving(true);
      await addCategoryToAPI({ name: newCatName.trim() });
      toast.success("Kategori ditambahkan");
      setNewCatName("");
      await loadData();
    } catch {
      toast.error("Gagal menambahkan kategori");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategoryFromAPI(id);
      toast.success("Kategori dihapus");
      await loadData();
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(
      p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
    );
  }, [products, searchQuery]);

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
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat Katalog Produk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-12 animate-in fade-in">
        <div className="mx-auto max-w-lg rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-destructive">Koneksi Terputus</h3>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">{error}</p>
          <Button onClick={loadData} className="shadow-md shadow-primary/20">
            Coba Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-6 rounded-3xl border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Katalog Produk
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar barang, harga, dan ketersediaan stok.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Cari nama atau barcode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 h-10 border-border/60 focus-visible:bg-background"
            />
          </div>

          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2 h-10 border border-border/50">
                <Tag className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Kategori</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" /> Kelola Kategori
                </DialogTitle>
                <DialogDescription>Kelompokkan produk agar mudah dicari pelanggan.</DialogDescription>
              </DialogHeader>
              
              <div className="flex gap-2 my-2">
                <Input
                  placeholder="Ketik nama kategori baru..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="bg-muted/30 focus-visible:bg-background"
                />
                <Button onClick={handleAddCategory} disabled={saving} className="px-3 shadow-md shadow-primary/20">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground w-full text-center py-4">Belum ada kategori.</p>
                ) : (
                  categories.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-center gap-1.5 rounded-full border border-border bg-card shadow-sm pl-3 pr-1 py-1 transition-colors hover:border-primary/40"
                    >
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-muted-foreground opacity-50 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                        onClick={() => handleDeleteCategory(c.id)}
                        disabled={saving}
                      >
                        <X className="h-3.5 w-3.5" /> 
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button className="gap-2 h-10 shadow-md shadow-primary/20" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Produk</span>
          </Button>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border/60 rounded-3xl bg-card/30">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Package className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Tidak ada produk ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery ? `Tidak ada barang yang cocok dengan kata kunci "${searchQuery}".` : "Toko Anda belum memiliki produk apapun. Klik 'Tambah Produk' untuk mulai berjualan."}
          </p>
          {searchQuery && (
             <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>Bersihkan Pencarian</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-card flex flex-col relative rounded-2xl">
              
              {/* Image Section */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={getProductImage(p)}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Category Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="backdrop-blur-md bg-background/80 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase text-foreground shadow-sm border border-border/50">
                    {categories.find((c) => c.id === p.category)?.name || "Lainnya"}
                  </span>
                </div>

                {/* Floating Actions Overlay */}
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-3 z-20">
                  <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shadow-lg bg-background hover:bg-primary hover:text-primary-foreground text-foreground transition-colors" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full shadow-lg opacity-90 hover:opacity-100" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-primary text-base">
                      Rp {p.price.toLocaleString("id-ID")}
                    </p>
                    
                    {/* Stock Badge */}
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      p.stock === 0 ? "bg-destructive/10 text-destructive border-destructive/20" :
                      p.stock <= 10 ? "bg-warning/10 text-warning border-warning/20" : 
                      "bg-success/10 text-success border-success/20"
                    }`}>
                      {p.stock === 0 ? "HABIS" : `Sisa ${p.stock}`}
                    </div>
                  </div>
                  
                  {p.barcode ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded-md w-fit border border-border/50">
                      <Barcode className="h-3 w-3" /> {p.barcode}
                    </div>
                  ) : (
                    <div className="h-5"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Dialog: Add/Edit Product */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-4xl rounded-3xl">
          <DialogHeader className="border-b border-border/50 px-6 py-5 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{editing ? "Edit Detail Produk" : "Tambah Produk Baru"}</DialogTitle>
                <DialogDescription className="text-sm">
                  {editing ? "Perbarui informasi, harga, dan ketersediaan stok." : "Lengkapi form berikut untuk memasukkan barang ke etalase."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-6 bg-secondary/5 custom-scrollbar">
            <div className="grid gap-8 lg:grid-cols-12">
              
              {/* Kolom Kiri: original preview (True Preview) */}
              <div className="lg:col-span-4 space-y-4">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Eye className="h-4 w-4 text-primary" /> Pratinjau Tampilan
                </p>
                
                <div className="rounded-2xl overflow-hidden border border-border/60 shadow-md bg-card mx-auto max-w-[240px] lg:max-w-none">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={() => setImagePreview("")} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                        <ImageIcon className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="backdrop-blur-md bg-background/80 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase text-foreground border border-border/50">
                        {categories.find((c) => c.id === form.category)?.name || "Kategori"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col">
                    <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight">
                      {form.name || "Nama Produk Akan Tampil Disini"}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-black text-primary text-base">
                        Rp {(form.price || 0).toLocaleString("id-ID")}
                      </p>
                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${form.stock === 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"}`}>
                        Sisa {form.stock || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-xs text-primary/80 leading-relaxed font-medium">
                  Informasi di atas adalah tampilan persis bagaimana pelanggan melihat produk Anda di etalase. 
                  *(Harga modal tidak akan ditampilkan ke pelanggan)*.
                </div>
              </div>

              {/* right column: Form Inputs */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Section 1: basic information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground">Informasi Utama</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Nama Produk <span className="text-destructive">*</span></Label>
                    <Input
                      id="product-name"
                      placeholder="Contoh: Es Teh Manis Jumbo"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={saving}
                      className="h-11 bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kategori <span className="text-destructive">*</span></Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger disabled={saving} className="h-11 bg-background">
                          <SelectValue placeholder="Pilih kategori barang" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="product-barcode">
                        Barcode <span className="text-xs text-muted-foreground font-normal">Opsional (Scan POS)</span>
                      </Label>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="product-barcode"
                          placeholder="0123456789"
                          value={form.barcode || ""}
                          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                          disabled={saving}
                          className="h-11 pl-10 font-mono text-sm bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: price & stock (Diperbarui dengan HPP) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Banknote className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground">Harga & Ketersediaan</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-capital">Harga Modal (Rp)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rp</span>
                        <Input
                          id="product-capital"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={form.capitalPrice || ""}
                          onChange={(e) => setForm({ ...form, capitalPrice: Number(e.target.value) || 0 })}
                          disabled={saving}
                          className="h-11 pl-9 bg-background"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="product-price">Harga Jual (Rp) <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rp</span>
                        <Input
                          id="product-price"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={form.price || ""}
                          onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                          disabled={saving}
                          className="h-11 pl-9 font-bold bg-background text-primary"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="product-stock">Jumlah Stok <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Boxes className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="product-stock"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={form.stock || ""}
                          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 0 })}
                          disabled={saving}
                          className="h-11 pl-9 bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Media & Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground">Media & Detail</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product-image">URL Gambar (Tautan Link)</Label>
                    <Input
                      id="product-image"
                      placeholder="https://contoh.com/gambar-produk.jpg"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      disabled={saving}
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-desc">Deskripsi Produk <span className="text-xs text-muted-foreground font-normal">(Muncul di e-commerce)</span></Label>
                    <Textarea
                      id="product-desc"
                      placeholder="Jelaskan detail ukuran, rasa, atau spesifikasi barang ini..."
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      disabled={saving}
                      className="resize-none bg-background custom-scrollbar"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 bg-card px-6 py-4 flex flex-row items-center justify-between sm:justify-between">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving} className="text-muted-foreground">
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-32 gap-2 h-11 shadow-md shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {editing ? "Simpan Perubahan" : "Tambahkan Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerProducts;