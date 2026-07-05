const express = require("express");
const router = express.Router();
const { 
  getDashboardStatsFull,
  getStores, createStore, updateStore, deleteStore, toggleStoreStatus,
  // Import controller pengguna baru
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus, getReports
} = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// Rute Statistik & Toko (sudah ada)
// ================= DASHBOARD ADMIN =================
router.get("/stats-full", verifyToken, getDashboardStatsFull);
router.get("/stores", verifyToken, getStores);
router.post("/stores", verifyToken, createStore);
router.put("/stores/:id", verifyToken, updateStore);
router.delete("/stores/:id", verifyToken, deleteStore);
router.patch("/stores/:id/status", verifyToken, toggleStoreStatus);

// ================= KELOLA PENGGUNA =================
router.get("/users", verifyToken, getUsers);
router.post("/users", verifyToken, createUser);
router.put("/users/:id", verifyToken, updateUser);
router.delete("/users/:id", verifyToken, deleteUser);
router.patch("/users/:id/status", verifyToken, toggleUserStatus);

// ================= LAPORAN GLOBAL =================
router.get("/reports", verifyToken, getReports);

module.exports = router;