const db = require("../config/db");
const crypto = require("crypto");

const generateId = () => crypto.randomUUID();

const resolveStoreId = (req) => req.query.storeId || req.body.storeId || req.headers["x-store-id"] || null;

// ================= KATEGORI =================
const getCategories = async (req, res) => {
  try {
    const storeId = resolveStoreId(req);
    const params = [];
    let sql = "SELECT id, id_toko, nama FROM kategori";
    if (storeId) { sql += " WHERE id_toko = ?"; params.push(storeId); }
    sql += " ORDER BY nama ASC";
    const [rows] = await db.query(sql, params);
    res.status(200).json({ success: true, data: rows, message: "OK" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil kategori", error: error.message });
  }
};

const createCategory = async (req, res) => {
  const { id: inputId, name, storeId } = req.body;
  if (!storeId) return res.status(400).json({ success: false, message: "storeId wajib diisi" });
  const id = inputId || generateId();
  try {
    const [existing] = await db.query("SELECT id FROM kategori WHERE id_toko = ? AND nama = ?", [storeId, name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Kategori sudah ada di toko ini" });
    }
    await db.query("INSERT INTO kategori (id, id_toko, nama) VALUES (?, ?, ?)", [id, storeId, name.trim()]);
    res.status(201).json({ success: true, data: { id, storeId, name: name.trim() } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah kategori", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query("SELECT id FROM kategori WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    await db.query("DELETE FROM kategori WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus kategori", error: error.message });
  }
};

// ================= PRODUK =================
const getProducts = async (req, res) => {
  try {
    const storeId = resolveStoreId(req);
    const { barcode } = req.query;
    const where = [];
    const params = [];
    if (storeId) { where.push("p.id_toko = ?"); params.push(storeId); }
    if (barcode) { where.push("p.barcode = ?"); params.push(barcode); }
    const sql = `
      SELECT p.*, k.nama AS kategori_nama
      FROM produk p
      LEFT JOIN kategori k ON p.id_kategori = k.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY p.nama ASC
    `;
    const [rows] = await db.query(sql, params);
    res.status(200).json({ success: true, data: rows, message: "OK" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil produk", error: error.message });
  }
};

const createProduct = async (req, res) => {
  const { id: inputId, category, name, price, stock = 0, image, description, barcode, minStock = 5, storeId } = req.body;
  if (!storeId) return res.status(400).json({ success: false, message: "storeId wajib diisi" });
  const id = inputId || generateId();

  try {
    const [catExists] = await db.query("SELECT id FROM kategori WHERE id = ? AND id_toko = ?", [category, storeId]);
    if (catExists.length === 0) {
      return res.status(400).json({ success: false, message: "Kategori tidak valid untuk toko ini" });
    }
    const [dup] = await db.query("SELECT id FROM produk WHERE id_toko = ? AND nama = ?", [storeId, name.trim()]);
    if (dup.length > 0) {
      return res.status(409).json({ success: false, message: "Produk dengan nama ini sudah ada di toko" });
    }
    await db.query(
      "INSERT INTO produk (id, id_toko, id_kategori, nama, harga, stok, stok_minimum, url_gambar, deskripsi, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, storeId, category, name.trim(), price, stock, minStock, image || null, description || null, barcode || null],
    );
    res.status(201).json({ success: true, data: { id, storeId, category, name: name.trim(), price, stock, image, description, barcode, minStock } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah produk", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category, name, price, stock = 0, image, description, barcode, minStock } = req.body;

  try {
    const [existing] = await db.query("SELECT id, id_toko FROM produk WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    const storeId = existing[0].id_toko;

    const [catExists] = await db.query("SELECT id FROM kategori WHERE id = ? AND id_toko = ?", [category, storeId]);
    if (catExists.length === 0) {
      return res.status(400).json({ success: false, message: "Kategori tidak valid untuk toko ini" });
    }

    await db.query(
      `UPDATE produk
       SET id_kategori = ?, nama = ?, harga = ?, stok = ?, stok_minimum = COALESCE(?, stok_minimum),
           url_gambar = ?, deskripsi = ?, barcode = ?
       WHERE id = ?`,
      [category, name.trim(), price, stock, minStock ?? null, image || null, description || null, barcode || null, id],
    );

    res.status(200).json({ success: true, data: { id, storeId, category, name: name.trim(), price, stock, image, description, barcode } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui produk", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query("SELECT id FROM produk WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    await db.query("DELETE FROM produk WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus produk", error: error.message });
  }
};

// Low stock report
const getLowStockProducts = async (req, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(400).json({ success: false, message: "storeId wajib" });
    const [rows] = await db.query(
      `SELECT p.*, k.nama AS kategori_nama
       FROM produk p LEFT JOIN kategori k ON p.id_kategori = k.id
       WHERE p.id_toko = ? AND p.stok <= p.stok_minimum
       ORDER BY p.stok ASC`,
      [storeId],
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil low stock", error: error.message });
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
  getLowStockProducts,
};
