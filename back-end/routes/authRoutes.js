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

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.get("/", getUsers);

// Protected routes (require authentication)
router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, updateProfile);

module.exports = router;
