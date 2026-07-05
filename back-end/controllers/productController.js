const db = require("../config/db");

// ================= FILTER MULTI-TENANT =================
const getResolvedStoreId = (req) => {
  return req.query.storeId || req.body.storeId || req.user?.store_id || null;
};

// ================= KATEGORI =================
const getCategories = async (req, res) => {
  const storeId = getResolvedStoreId(req);
  if (!storeId) return res.status(400).json({ success: false, message: "ID Toko (storeId) wajib disertakan" });
  try {
    const [rows] = await db.query("SELECT id, nama AS name FROM categories WHERE store_id = ?", [storeId]);
    res.status(200).json({ success: true, data: rows, message: "Data kategori berhasil diambil" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data kategori", error: error.message });
  }
};

const createCategory = async (req, res) => {
  const { name } = req.body;
  const storeId = getResolvedStoreId(req);
  if (!storeId || !name) return res.status(400).json({ success: false, message: "ID Toko dan Nama Kategori wajib diisi" });
  try {
    const [existing] = await db.query("SELECT id FROM categories WHERE nama = ? AND store_id = ?", [name.trim(), storeId]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: "Kategori dengan nama ini sudah ada di toko Anda" });
    const [result] = await db.query("INSERT INTO categories (store_id, nama) VALUES (?, ?)", [storeId, name.trim()]);
    res.status(201).json({ success: true, data: { id: result.insertId, name: name.trim() }, message: "Kategori berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan kategori", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus kategori", error: error.message });
  }
};

// ================= PRODUK =================
const getProducts = async (req, res) => {
  const storeId = getResolvedStoreId(req);
  const barcode = req.query.barcode;
  if (!storeId) return res.status(400).json({ success: false, message: "ID Toko (storeId) wajib disertakan" });

  try {
    // PERBAIKAN: Memastikan tabel 'products' sesuai dengan database Anda
    let query = `
      SELECT 
        p.id, 
        p.id_kategori AS category, 
        p.nama AS name, 
        p.harga AS price, 
        p.harga_modal AS capitalPrice, 
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
    
    const formattedRows = rows.map(row => ({
        ...row,
        price: Number(row.price),
        capitalPrice: Number(row.capitalPrice || 0)
    }));
    res.status(200).json({ success: true, data: formattedRows, message: "Data produk berhasil diambil" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data produk", error: error.message });
  }
};

const createProduct = async (req, res) => {
  // Tangkap semua kemungkinan nama key (Inggris/Indonesia)
  const { category, id_kategori, name, nama, price, harga, capitalPrice, harga_modal, stock, stok, image, url_gambar, description, deskripsi, barcode } = req.body;
  const storeId = getResolvedStoreId(req);
  
  const finalCategory = category || id_kategori;
  const finalName = name || nama;
  const finalPrice = price || harga;
  const finalCapitalPrice = capitalPrice || harga_modal || 0;
  const finalStock = stock || stok || 0;
  const finalImage = image || url_gambar || null;
  const finalDesc = description || deskripsi || null;

  if (!storeId || !finalCategory || !finalName || !finalPrice) {
    return res.status(400).json({ success: false, message: "Lengkapi data wajib: Toko, Kategori, Nama, Harga" });
  }

  try {
    const [catExists] = await db.query("SELECT id FROM categories WHERE id = ?", [finalCategory]);
    if (catExists.length === 0) return res.status(400).json({ success: false, message: "Kategori tidak valid" });

    const [dupProduct] = await db.query("SELECT id FROM products WHERE nama = ? AND store_id = ?", [finalName.trim(), storeId]);
    if (dupProduct.length > 0) return res.status(409).json({ success: false, message: "Produk dengan nama ini sudah ada di toko Anda" });

    const [result] = await db.query(
      "INSERT INTO products (id_kategori, store_id, barcode, nama, harga, harga_modal, stok, url_gambar, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [finalCategory, storeId, barcode || null, finalName.trim(), finalPrice, finalCapitalPrice, finalStock, finalImage, finalDesc]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, category: finalCategory, name: finalName.trim(), price: Number(finalPrice), capitalPrice: Number(finalCapitalPrice), stock: finalStock, image: finalImage, description: finalDesc, barcode },
      message: "Produk berhasil ditambahkan",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan produk", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category, id_kategori, name, nama, price, harga, capitalPrice, harga_modal, stock, stok, image, url_gambar, description, deskripsi, barcode } = req.body;
  
  const finalCategory = category || id_kategori;
  const finalName = name || nama;
  const finalPrice = price || harga;
  const finalCapitalPrice = capitalPrice || harga_modal || 0;
  const finalStock = stock || stok || 0;
  const finalImage = image || url_gambar || null;
  const finalDesc = description || deskripsi || null;

  try {
    const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });

    await db.query(
      "UPDATE products SET id_kategori = ?, nama = ?, harga = ?, harga_modal = ?, stok = ?, url_gambar = ?, deskripsi = ?, barcode = ? WHERE id = ?",
      [finalCategory, finalName.trim(), finalPrice, finalCapitalPrice, finalStock, finalImage, finalDesc, barcode || null, id]
    );

    res.status(200).json({
      success: true,
      data: { id: Number(id), category: finalCategory, name: finalName.trim(), price: Number(finalPrice), capitalPrice: Number(finalCapitalPrice), stock: finalStock, image: finalImage, description: finalDesc, barcode },
      message: "Produk berhasil diperbarui",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui produk", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });

    await db.query("DELETE FROM products WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus produk", error: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory, getProducts, createProduct, updateProduct, deleteProduct };