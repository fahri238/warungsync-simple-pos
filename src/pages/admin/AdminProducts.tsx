import { useState } from "react";
import { getProducts, getCategories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, generateId } from "@/lib/store";
import type { Product, Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

const emptyProduct: Omit<Product, "id"> = { name: "", price: 0, stock: 0, category: "", image: "📦", description: "" };

const AdminProducts = () => {
  const [products, setProducts] = useState(getProducts);
  const [categories, setCategories] = useState(getCategories);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

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
                  <Button onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(c.id)}>
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
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="mb-3 text-center text-5xl">{p.image}</div>
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
            <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Harga (Rp)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Stok</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Emoji/Image</Label><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
            <div><Label>Deskripsi</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
