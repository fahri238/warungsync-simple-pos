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
const {
  validateProduct,
  validateCategory,
} = require("../middleware/validation");

// Routes Kategori
router.get("/categories", getCategories);
router.post("/categories", validateCategory, createCategory);
router.delete("/categories/:id", deleteCategory);

// Routes Produk
router.get("/", getProducts);
router.post("/", validateProduct, createProduct);
router.put("/:id", validateProduct, updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
