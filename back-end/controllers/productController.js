const db = require("../config/db");
const crypto = require("crypto");

// Helper function to generate ID
const generateId = () => crypto.randomUUID();

// ================= KATEGORI =================

// 1. Ambil Semua Kategori (GET)
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM kategori");
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
  const { id: inputId, name } = req.body;
  const id = inputId || generateId();

  try {
    // Check if category with same name already exists
    const [existing] = await db.query(
      "SELECT id FROM kategori WHERE nama = ?",
      [name.trim()],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Kategori dengan nama ini sudah ada",
      });
    }

    await db.query("INSERT INTO kategori (id, nama) VALUES (?, ?)", [
      id,
      name.trim(),
    ]);
    res.status(201).json({
      success: true,
      data: { id, name: name.trim() },
      message: "Kategori berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan kategori",
      error: error.message,
    });
  }
};

// 3. Hapus Kategori (DELETE)
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if category exists
    const [existing] = await db.query("SELECT id FROM kategori WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    await db.query("DELETE FROM kategori WHERE id = ?", [id]);
    res.status(200).json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus kategori",
      error: error.message,
    });
  }
};

// ================= PRODUK =================

// 1. Ambil Semua Produk (GET)
const getProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
            SELECT p.*, k.nama as kategori_nama
            FROM produk p
            LEFT JOIN kategori k ON p.id_kategori = k.id
        `);
    res.status(200).json({
      success: true,
      data: rows,
      message: "Data produk berhasil diambil",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
      error: error.message,
    });
  }
};

// 2. Tambah Produk (POST)
const createProduct = async (req, res) => {
  const {
    id: inputId,
    category,
    name,
    price,
    stock = 0,
    image,
    description,
  } = req.body;
  const id = inputId || generateId();

  try {
    // Verify category exists
    const [catExists] = await db.query("SELECT id FROM kategori WHERE id = ?", [
      category,
    ]);
    if (catExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kategori tidak valid",
      });
    }

    // Check for duplicate product name
    const [dupProduct] = await db.query(
      "SELECT id FROM produk WHERE nama = ?",
      [name.trim()],
    );
    if (dupProduct.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Produk dengan nama ini sudah ada",
      });
    }

    await db.query(
      "INSERT INTO produk (id, id_kategori, nama, harga, stok, url_gambar, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        category,
        name.trim(),
        price,
        stock,
        image || null,
        description || null,
      ],
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        category,
        name: name.trim(),
        price,
        stock,
        image,
        description,
      },
      message: "Produk berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk",
      error: error.message,
    });
  }
};

// 3. Ubah Produk (PUT)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category, name, price, stock = 0, image, description } = req.body;

  try {
    // Check if product exists
    const [existing] = await db.query("SELECT id FROM produk WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    // Verify category exists
    const [catExists] = await db.query("SELECT id FROM kategori WHERE id = ?", [
      category,
    ]);
    if (catExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kategori tidak valid",
      });
    }

    await db.query(
      "UPDATE produk SET id_kategori = ?, nama = ?, harga = ?, stok = ?, url_gambar = ?, deskripsi = ? WHERE id = ?",
      [
        category,
        name.trim(),
        price,
        stock,
        image || null,
        description || null,
        id,
      ],
    );

    res.status(200).json({
      success: true,
      data: {
        id,
        category,
        name: name.trim(),
        price,
        stock,
        image,
        description,
      },
      message: "Produk berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui produk",
      error: error.message,
    });
  }
};

// 4. Hapus Produk (DELETE)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists
    const [existing] = await db.query("SELECT id FROM produk WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    await db.query("DELETE FROM produk WHERE id = ?", [id]);
    res.status(200).json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus produk",
      error: error.message,
    });
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

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
