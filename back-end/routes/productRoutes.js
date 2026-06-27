const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  validateProduct,
  validateCategory,
} = require("../middleware/validation");

// ================= PUBLIC ROUTES =================
// Pelanggan atau pengunjung bebas melihat kategori dan katalog produk 
// (Frontend akan mengirimkan query ?storeId=... agar produk yang tampil sesuai toko)

router.get("/categories", getCategories);
router.get("/", getProducts);

// ================= PROTECTED ROUTES =================
// Hanya pengguna (Admin) yang sudah login yang bisa menambah, mengubah, atau menghapus data

// Rute Manajemen Kategori (Dilindungi)
router.post("/categories", verifyToken, validateCategory, createCategory);
router.delete("/categories/:id", verifyToken, deleteCategory);

// Rute Manajemen Produk (Dilindungi)
router.post("/", verifyToken, validateProduct, createProduct);
router.put("/:id", verifyToken, validateProduct, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;