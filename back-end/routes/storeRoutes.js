const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const { verifyToken } = require("../middleware/authMiddleware");

// ================= PUBLIC ROUTES =================
// Bisa diakses oleh siapa saja (Pelanggan yang ingin memilih warung atau berbelanja)

// Ambil daftar semua toko
router.get("/", storeController.getStores);

// PERBAIKAN: Tambahkan route /list agar cocok dengan panggilan API dari Frontend saat registrasi kurir
router.get("/list", storeController.getStores);

// Ambil detail satu toko spesifik
router.get("/:id", storeController.getStoreById);

// Ambil tarif ongkos kirim untuk toko tertentu (dibutuhkan saat checkout)
router.get("/:id/shipping-rates", storeController.getShippingRates);


// ================= PROTECTED ROUTES =================
// Hanya pengguna terautentikasi (seperti Super Admin) yang bisa membuat toko baru

router.post("/", verifyToken, storeController.createStore);

module.exports = router;