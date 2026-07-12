const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // TAMBAHAN BARU: Modul File System

const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  getUsers,
  getPendingCouriers,
  manageCourierStatus,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

// ================= KONFIGURASI MULTER (UPLOAD KTP) =================
// TAMBAHAN BARU: Buat folder otomatis jika belum ada
const uploadDir = path.join(__dirname, "../public/uploads/ktp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // recursive: true akan membuatkan folder public dan uploads juga jika belum ada
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // KTP akan disimpan di folder public/uploads/ktp
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nama file diubah agar unik dengan menambahkan stempel waktu
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "ktp-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas maksimal ukuran file 5MB
});

// ================= PUBLIC ROUTES =================
// Bisa diakses oleh siapa saja (tamu yang belum login)

router.post(
  "/register",
  upload.single("foto_ktp"),
  validateRegistration,
  register,
);
router.post("/login", validateLogin, login);

// ================= PROTECTED ROUTES =================
// Wajib menyertakan token JWT di header (sudah login)

// Rute khusus untuk fitur approval kurir oleh owner
router.get("/pending-couriers", verifyToken, getPendingCouriers);
router.put("/courier/:id/status", verifyToken, manageCourierStatus);

router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, updateProfile);

router.get("/", verifyToken, getUsers);

module.exports = router;
