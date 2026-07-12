const express = require("express");
const router = express.Router();
const { 
  getDashboardStatsFull,
  getStores, createStore, updateStore, deleteStore, toggleStoreStatus,
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus, getReports,
  getPendingOwners, manageOwnerStatus // IMPORT FUNGSI BARU
} = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// ================= DASHBOARD ADMIN =================
router.get("/stats-full", verifyToken, getDashboardStatsFull);
router.get("/stores", verifyToken, getStores);
router.post("/stores", verifyToken, createStore);
router.put("/stores/:id", verifyToken, updateStore);
router.delete("/stores/:id", verifyToken, deleteStore);
router.patch("/stores/:id/status", verifyToken, toggleStoreStatus);

// ================= VERIFIKASI OWNER (KYC) BARU =================
router.get("/pending-owners", verifyToken, getPendingOwners);
router.put("/owner/:id/status", verifyToken, manageOwnerStatus);

// ================= KELOLA PENGGUNA =================
router.get("/users", verifyToken, getUsers);
router.post("/users", verifyToken, createUser);
router.put("/users/:id", verifyToken, updateUser);
router.delete("/users/:id", verifyToken, deleteUser);
router.patch("/users/:id/status", verifyToken, toggleUserStatus);

// ================= LAPORAN GLOBAL =================
router.get("/reports", verifyToken, getReports);

module.exports = router;