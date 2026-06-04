import { useState, useEffect } from "react";
import {
  getProductsFromAPI,
  getCategoriesFromAPI,
  addProductToAPI,
  updateProductInAPI,
  deleteProductFromAPI,
  addCategoryToAPI,
  deleteCategoryFromAPI,
  getProductImage,
  DEFAULT_STORE_ID,
} from "@/lib/store";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { toast } from "sonner";

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  price: 0,
  stock: 0,
  category: "",
  barcode: "",
  image: "",
  description: "",
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [imagePreview, setImagePreview] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.image && form.image.length > 5) {
      setImagePreview(form.image);
    } else {
      setImagePreview("");
    }
  }, [form.image]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [prods, cats] = await Promise.all([
        getProductsFromAPI(DEFAULT_STORE_ID),
        getCategoriesFromAPI(DEFAULT_STORE_ID),
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
    if (!form.name || !form.category || form.price <= 0) {
      toast.error("Lengkapi nama, kategori, dan harga");
      return;
    }

    try {
      setSaving(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-12">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold text-destructive">Gagal memuat produk</h3>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadData} variant="outline">
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Produk</h2>
          <p className="text-sm text-muted-foreground">{products.length} item terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Kelola Kategori</DialogTitle>
                <DialogDescription>Tambah atau hapus kategori produk toko Anda.</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Input
                  placeholder="Nama kategori baru"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} disabled={saving} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteCategory(c.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <div className="aspect-square bg-muted">
              <img
                src={getProductImage(p)}
                alt={p.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground line-clamp-1">{p.name}</h3>
              <p className="text-sm font-bold text-primary">
                Rp {p.price.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground">
                Stok: {p.stock} · {categories.find((c) => c.id === p.category)?.name || "—"}
              </p>
              {p.barcode && (
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.barcode}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(p)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Perbarui detail produk di katalog toko." : "Isi informasi produk baru."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-5">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Preview */}
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pratinjau
                </p>
                <div className="overflow-hidden rounded-xl border bg-muted/40">
                  <div className="aspect-square bg-muted">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={() => setImagePreview("")}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-10 w-10 opacity-40" />
                        <span className="text-xs">Belum ada gambar</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 border-t bg-card p-3">
                    <p className="font-semibold text-foreground line-clamp-1">
                      {form.name || "Nama produk"}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      Rp {(form.price || 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-muted-foreground">Stok: {form.stock ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-5 lg:col-span-3">
                <div>
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Informasi dasar
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="product-name">Nama produk</Label>
                      <Input
                        id="product-name"
                        placeholder="Contoh: Es Teh Manis"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="product-price" className="flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          Harga (Rp)
                        </Label>
                        <Input
                          id="product-price"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={form.price || ""}
                          onChange={(e) =>
                            setForm({ ...form, price: Number(e.target.value) || 0 })
                          }
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="product-stock" className="flex items-center gap-1">
                          <Boxes className="h-3 w-3" />
                          Stok
                        </Label>
                        <Input
                          id="product-stock"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={form.stock || ""}
                          onChange={(e) =>
                            setForm({ ...form, stock: Number(e.target.value) || 0 })
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Kategori</Label>
                        <Select
                          value={form.category}
                          onValueChange={(v) => setForm({ ...form, category: v })}
                        >
                          <SelectTrigger disabled={saving}>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="product-barcode" className="flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          Barcode
                        </Label>
                        <Input
                          id="product-barcode"
                          placeholder="Opsional"
                          value={form.barcode || ""}
                          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                          disabled={saving}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Media & deskripsi
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="product-image">URL gambar</Label>
                      <Input
                        id="product-image"
                        placeholder="https://..."
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="product-desc">Deskripsi</Label>
                      <Textarea
                        id="product-desc"
                        placeholder="Deskripsi singkat produk..."
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        disabled={saving}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-28 gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Simpan perubahan" : "Tambah produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
