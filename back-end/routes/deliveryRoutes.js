const express = require("express");
const router = express.Router();
const {
  assignCourier,
  completeDelivery,
} = require("../controllers/deliveryController");
const { verifyToken } = require("../middleware/authMiddleware");

// ================= PROTECTED ROUTES =================
// Wajib menyertakan token JWT (Hanya Admin atau Kurir yang sudah login)

// Rute untuk menugaskan pesanan ke kurir
router.post("/assign", verifyToken, assignCourier);

// Rute untuk menandai bahwa pengiriman telah selesai
router.put("/:id/complete", verifyToken, completeDelivery);

module.exports = router;