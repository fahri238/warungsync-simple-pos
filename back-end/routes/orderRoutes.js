const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Tambahkan modul File System

// Pastikan folder 'uploads' otomatis dibuat jika belum ada
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer untuk Menerima Foto Bukti Transfer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Arahkan ke folder yang sudah dipastikan ada
  },
  filename: function (req, file, cb) {
    cb(null, "tf-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const {
  getOrders,
  createOrder,
  updateOrderStatus,
} = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// Route untuk Pesanan
router.get("/", verifyToken, getOrders);
router.post("/", verifyToken, upload.single("bukti_transfer"), createOrder);
router.put("/:id/status", verifyToken, updateOrderStatus);

module.exports = router;
