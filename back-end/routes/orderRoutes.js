const express = require("express");
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
} = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// ================= PROTECTED ROUTES =================
// Semua rute pesanan wajib menyertakan token JWT agar sistem tahu 
// siapa yang sedang membuat pesanan atau mengubah statusnya.

// Ambil data pesanan (Admin melihat pesanan tokonya, Pelanggan melihat riwayat belanjanya)
router.get("/", verifyToken, getOrders);

// Buat pesanan baru (Checkout E-Commerce atau Transaksi Kasir POS)
router.post("/", verifyToken, createOrder);

// Ubah status pesanan (Misal: dari 'pending' menjadi 'processing' oleh Admin)
router.put("/:id/status", verifyToken, updateOrderStatus);

module.exports = router;