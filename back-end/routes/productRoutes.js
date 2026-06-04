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
  getLowStockProducts,
} = require("../controllers/productController");
const { validateProduct, validateCategory } = require("../middleware/validation");

// Kategori
router.get("/categories", getCategories);
router.post("/categories", validateCategory, createCategory);
router.delete("/categories/:id", deleteCategory);

// Produk
router.get("/", getProducts);
router.get("/low-stock", getLowStockProducts);
router.post("/", validateProduct, createProduct);
router.put("/:id", validateProduct, updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
