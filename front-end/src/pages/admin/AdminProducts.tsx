<<<<<<< HEAD
import { useState } from "react";
import { getProducts, getCategories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, generateId, getProductImage } from "@/lib/store";
=======
import { useState, useEffect } from "react";
import {
  getProductsFromAPI,
  getCategoriesFromAPI,
  addProductToAPI,
  updateProductInAPI,
  deleteProductFromAPI,
  addCategoryToAPI,
  deleteCategoryFromAPI,
  getProductImage
} from "@/lib/store";
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
<<<<<<< HEAD
import { Plus, Pencil, Trash2, Tag, ImageIcon } from "lucide-react";
=======
import { Plus, Pencil, Trash2, Tag, ImageIcon, Loader2 } from "lucide-react";
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
import { toast } from "sonner";

const emptyProduct: Omit<Product, "id"> = { name: "", price: 0, stock: 0, category: "", image: "", description: "" };

const AdminProducts = () => {
<<<<<<< HEAD
  const [products, setProducts] = useState(getProducts);
  const [categories, setCategories] = useState(getCategories);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
=======
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [imagePreview, setImagePreview] = useState<string>("");
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

<<<<<<< HEAD
  const openAdd = () => { setEditing(null); setForm(emptyProduct); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.category || form.price <= 0) { toast.error("Isi semua field"); return; }
    if (editing) {
      const updated = { ...editing, ...form };
      updateProduct(updated);
      setProducts(getProducts());
      toast.success("Produk diperbarui");
    } else {
      const newP: Product = { id: generateId(), ...form };
      addProduct(newP);
      setProducts(getProducts());
      toast.success("Produk ditambahkan");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setProducts(getProducts());
    toast.success("Produk dihapus");
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({ id: generateId(), name: newCatName.trim() });
    setCategories(getCategories());
    setNewCatName("");
    toast.success("Kategori ditambahkan");
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    setCategories(getCategories());
    toast.success("Kategori dihapus");
  };

=======
  // Load products and categories on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update image preview when form.image changes
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
        getProductsFromAPI(),
        getCategoriesFromAPI()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      const errorMsg = error?.message || "Gagal memuat data produk dan kategori. Pastikan backend berjalan di http://localhost:5000";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setImagePreview(""); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setImagePreview(p.image || ""); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.category || form.price <= 0) {
      toast.error("Isi semua field");
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
      // Reload data
      await loadData();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
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
    } catch (error) {
      console.error('Error deleting product:', error);
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
    } catch (error) {
      console.error('Error adding category:', error);
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
    } catch (error) {
      console.error('Error deleting category:', error);
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
          <h3 className="text-lg font-semibold text-destructive mb-2">⚠️ Error Loading Products</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Produk ({products.length})</h2>
        <div className="flex gap-2">
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Tag className="h-4 w-4" />Kategori</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Kelola Kategori</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Nama kategori baru" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
<<<<<<< HEAD
                  <Button onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
=======
                  <Button onClick={handleAddCategory} disabled={saving}><Plus className="h-4 w-4" /></Button>
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
                </div>
                <div className="space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                      <span className="text-sm font-medium">{c.name}</span>
<<<<<<< HEAD
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(c.id)}>
=======
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(c.id)} disabled={saving}>
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" />Tambah Produk</Button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(p => (
          <Card key={p.id} className="overflow-hidden">
            <div className="aspect-square bg-muted">
              <img src={getProductImage(p)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground">{p.name}</h3>
              <p className="text-sm font-bold text-primary">Rp {p.price.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">Stok: {p.stock} · {categories.find(c => c.id === p.category)?.name}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(p)}>
                  <Pencil className="h-3 w-3" />Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
<<<<<<< HEAD
            <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Harga (Rp)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Stok</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
=======
            <div>
              <Label>Nama</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={saving} className="mt-2" />
            </div>
            <div>
              <Label>Harga (Rp)</Label>
              <Input type="number" placeholder="0" value={form.price || ""} onChange={e => setForm({ ...form, price: Number(e.target.value) || 0 })} disabled={saving} className="mt-2" />
            </div>
            <div>
              <Label>Stok</Label>
              <Input type="number" placeholder="0" value={form.stock || ""} onChange={e => setForm({ ...form, stock: Number(e.target.value) || 0 })} disabled={saving} className="mt-2" />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger disabled={saving} className="mt-2"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />URL Gambar Produk</Label>
<<<<<<< HEAD
              <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://contoh.com/gambar.jpg (kosongkan untuk default)" />
              {form.image && form.image.length > 5 && (
                <img src={form.image} alt="Preview" className="mt-2 h-24 w-24 rounded-lg border object-cover" />
              )}
            </div>
            <div><Label>Deskripsi</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Simpan" : "Tambah"}</Button>
=======
              <Input
                placeholder="https://contoh.com/gambar.jpg"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                disabled={saving}
                className="mt-2"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-lg border object-cover" />
                </div>
              )}
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} disabled={saving} className="mt-2" />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editing ? "Simpan" : "Tambah"}
            </Button>
>>>>>>> 72971a4b8e369be54608e64de8db797937ea951c
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
