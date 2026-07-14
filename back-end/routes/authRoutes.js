const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  register, login, getCurrentUser, updateProfile, getUsers,
  getPendingCouriers, manageCourierStatus, getActiveCouriers,
  updateCourier, deleteCourier,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const { validateRegistration, validateLogin } = require("../middleware/validation");

// ================= KONFIGURASI MULTER (MULTIPLE UPLOADS) =================
const ktpDir = path.join(__dirname, "../public/uploads/ktp");
const warungDir = path.join(__dirname, "../public/uploads/warung");

if (!fs.existsSync(ktpDir)) fs.mkdirSync(ktpDir, { recursive: true });
if (!fs.existsSync(warungDir)) fs.mkdirSync(warungDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "foto_warung") {
      cb(null, warungDir);
    } else {
      cb(null, ktpDir);
    }
  },
  filename: function (req, file, cb) {
    const prefix = file.fieldname === "foto_warung" ? "warung-" : "ktp-";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB per file
});

// ================= PUBLIC ROUTES =================
router.post(
  "/register",
  // PERBAIKAN: Menggunakan fields untuk menerima banyak gambar
  upload.fields([
    { name: "foto_ktp", maxCount: 1 },
    { name: "foto_warung", maxCount: 1 }
  ]),
  validateRegistration,
  register,
);
router.post("/login", validateLogin, login);

// ================= PROTECTED ROUTES =================
router.get("/pending-couriers", verifyToken, getPendingCouriers);
router.put("/courier/:id/status", verifyToken, manageCourierStatus);
router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, updateProfile);
router.get("/", verifyToken, getUsers);

router.get("/active-couriers", verifyToken, getActiveCouriers);
router.put("/courier/:id", verifyToken, updateCourier);
router.delete("/courier/:id", verifyToken, deleteCourier);

module.exports = router;