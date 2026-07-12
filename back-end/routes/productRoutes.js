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
  getStockLogs,
} = require("../controllers/productController");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  validateProduct,
  validateCategory,
} = require("../middleware/validation");

// ================= PUBLIC ROUTES =================
router.get("/categories", getCategories);
router.get("/", getProducts);

// ================= PROTECTED ROUTES =================

// Rute Manajemen Kategori
router.post("/categories", verifyToken, validateCategory, createCategory);
router.delete("/categories/:id", verifyToken, deleteCategory);

// PERBAIKAN: Rute log stok HARUS DI ATAS rute /:id
router.get("/stock-logs", verifyToken, getStockLogs);

// Rute Manajemen Produk
router.post("/", verifyToken, validateProduct, createProduct);
router.put("/:id", verifyToken, validateProduct, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;