const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  getUsers,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

// ================= PUBLIC ROUTES =================
// Bisa diakses oleh siapa saja (tamu yang belum login)
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);

// ================= PROTECTED ROUTES =================
// Wajib menyertakan token JWT di header (sudah login)
router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, updateProfile);

// PERBAIKAN: getUsers dipindah ke sini agar req.user (data login admin) bisa dibaca
router.get("/", verifyToken, getUsers);

module.exports = router;