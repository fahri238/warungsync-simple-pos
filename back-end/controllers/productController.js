const db = require("../config/db");

// ================= FILTER MULTI-TENANT =================
// Helper untuk mengamankan data agar warung A tidak bisa melihat barang warung B
const getResolvedStoreId = (req) => {
  return req.query.storeId || 
         req.body.storeId || 
         req.user?.store_id || 
         null;
};

// ================= KATEGORI =================

// 1. Ambil Semua Kategori (GET)
const getCategories = async (req, res) => {
  const storeId = getResolvedStoreId(req);
  
  if (!storeId) {
    return res.status(400).json({ success: false, message: "ID Toko (storeId) wajib disertakan" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, nama AS name FROM categories WHERE store_id = ?",
      [storeId]
    );
    res.status(200).json({
      success: true,
      data: rows,
      message: "Data kategori berhasil diambil",
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori",
      error: error.message,
    });
  }
};

// 2. Tambah Kategori (POST)
const createCategory = async (req, res) => {
  const { name } = req.body;
  const storeId = getResolvedStoreId(req);

  if (!storeId || !name) {
    return res.status(400).json({ success: false, message: "ID Toko dan Nama Kategori wajib diisi" });
  }

  try {
    // Cek duplikasi nama kategori di toko yang sama
    const [existing] = await db.query(
      "SELECT id FROM categories WHERE nama = ? AND store_id = ?",
      [name.trim(), storeId]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Kategori dengan nama ini sudah ada di toko Anda" });
    }

    const [result] = await db.query(
      "INSERT INTO categories (store_id, nama) VALUES (?, ?)", 
      [storeId, name.trim()]
    );
    
    res.status(201).json({
      success: true,
      data: { id: result.insertId, name: name.trim() },
      message: "Kategori berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Gagal menambahkan kategori", error: error.message });
  }
};

// 3. Hapus Kategori (DELETE)
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    }

    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus kategori (Mungkin masih ada produk yang menggunakan kategori ini)", error: error.message });
  }
};

// ================= PRODUK =================

// 1. Ambil Semua Produk (GET)
const getProducts = async (req, res) => {
  const storeId = getResolvedStoreId(req);
  const barcode = req.query.barcode;

  if (!storeId) {
    return res.status(400).json({ success: false, message: "ID Toko (storeId) wajib disertakan" });
  }

  try {
    let query = `
      SELECT 
        p.id, 
        p.id_kategori AS category, 
        p.nama AS name, 
        p.harga AS price, 
        p.stok AS stock, 
        p.url_gambar AS image, 
        p.deskripsi AS description, 
        p.barcode,
        c.nama AS category_name
      FROM products p
      LEFT JOIN categories c ON p.id_kategori = c.id
      WHERE p.store_id = ?
    `;
    const queryParams = [storeId];

    if (barcode) {
      query += " AND p.barcode = ?";
      queryParams.push(barcode);
    }

    const [rows] = await db.query(query, queryParams);
    
    // Konversi nilai Decimal ke Number agar frontend tidak error
    const formattedRows = rows.map(row => ({
        ...row,
        price: Number(row.price)
    }));

    res.status(200).json({
      success: true,
      data: formattedRows,
      message: "Data produk berhasil diambil",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data produk", error: error.message });
  }
};

// 2. Tambah Produk (POST)
const createProduct = async (req, res) => {
  const { category, name, price, stock = 0, image, description, barcode } = req.body;
  const storeId = getResolvedStoreId(req);

  if (!storeId || !category || !name || !price) {
    return res.status(400).json({ success: false, message: "Lengkapi data wajib: Toko, Kategori, Nama, Harga" });
  }

  try {
    const [catExists] = await db.query("SELECT id FROM categories WHERE id = ?", [category]);
    if (catExists.length === 0) {
      return res.status(400).json({ success: false, message: "Kategori tidak valid" });
    }

    const [dupProduct] = await db.query("SELECT id FROM products WHERE nama = ? AND store_id = ?", [name.trim(), storeId]);
    if (dupProduct.length > 0) {
      return res.status(409).json({ success: false, message: "Produk dengan nama ini sudah ada di toko Anda" });
    }

    const [result] = await db.query(
      "INSERT INTO products (id_kategori, store_id, barcode, nama, harga, stok, url_gambar, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [category, storeId, barcode || null, name.trim(), price, stock, image || null, description || null]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        category,
        name: name.trim(),
        price: Number(price),
        stock,
        image,
        description,
        barcode
      },
      message: "Produk berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Gagal menambahkan produk", error: error.message });
  }
};

// 3. Ubah Produk (PUT)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category, name, price, stock = 0, image, description, barcode } = req.body;

  try {
    const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }

    const [catExists] = await db.query("SELECT id FROM categories WHERE id = ?", [category]);
    if (catExists.length === 0) {
      return res.status(400).json({ success: false, message: "Kategori tidak valid" });
    }

    await db.query(
      "UPDATE products SET id_kategori = ?, nama = ?, harga = ?, stok = ?, url_gambar = ?, deskripsi = ?, barcode = ? WHERE id = ?",
      [category, name.trim(), price, stock, image || null, description || null, barcode || null, id]
    );

    res.status(200).json({
      success: true,
      data: { id: Number(id), category, name: name.trim(), price: Number(price), stock, image, description, barcode },
      message: "Produk berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui produk", error: error.message });
  }
};

// 4. Hapus Produk (DELETE)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }

    await db.query("DELETE FROM products WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus produk (Mungkin masih terikat dengan pesanan)", error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};