const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { 
  getDashboardStatsFull,
  getStores, createStore, updateStore, deleteStore, toggleStoreStatus,
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus, getReports,
  getPendingOwners, manageOwnerStatus,
  // IMPORT FUNGSI BARU UNTUK ADMIN
  approveCourierByAdmin,
  getAdminBankAccounts, addAdminBankAccount, deleteAdminBankAccount
} = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// ================= KONFIGURASI MULTER (MULTIPLE UPLOADS ADMIN) =================
const ktpDir = path.join(__dirname, "../public/uploads/ktp");
const warungDir = path.join(__dirname, "../public/uploads/warung");
if (!fs.existsSync(ktpDir)) fs.mkdirSync(ktpDir, { recursive: true });
if (!fs.existsSync(warungDir)) fs.mkdirSync(warungDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "foto_warung") cb(null, warungDir);
    else cb(null, ktpDir);
  },
  filename: function (req, file, cb) {
    const prefix = file.fieldname === "foto_warung" ? "warung-admin-" : "ktp-admin-";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });


// ================= DASHBOARD ADMIN =================
router.get("/stats-full", verifyToken, getDashboardStatsFull);
router.get("/stores", verifyToken, getStores);
router.post("/stores", verifyToken, createStore);
router.put("/stores/:id", verifyToken, updateStore);
router.delete("/stores/:id", verifyToken, deleteStore);
router.patch("/stores/:id/status", verifyToken, toggleStoreStatus);

// ================= VERIFIKASI KYC =================
router.get("/pending-owners", verifyToken, getPendingOwners);
router.put("/owner/:id/status", verifyToken, manageOwnerStatus);
router.put("/courier/:id/approve", verifyToken, approveCourierByAdmin); // RUTE APPROVE KURIR

// ================= MANAJEMEN PENGGUNA (DENGAN UPLOAD) =================
router.get("/users", verifyToken, getUsers);
router.post("/users", verifyToken, upload.fields([{ name: "foto_ktp", maxCount: 1 }, { name: "foto_warung", maxCount: 1 }]), createUser);
router.put("/users/:id", verifyToken, upload.fields([{ name: "foto_ktp", maxCount: 1 }, { name: "foto_warung", maxCount: 1 }]), updateUser);
router.delete("/users/:id", verifyToken, deleteUser);
router.patch("/users/:id/status", verifyToken, toggleUserStatus);

// ================= MANAJEMEN REKENING OWNER OLEH ADMIN =================
router.get("/banks/:storeId", verifyToken, getAdminBankAccounts);
router.post("/banks/:storeId", verifyToken, addAdminBankAccount);
router.delete("/banks/delete/:id", verifyToken, deleteAdminBankAccount);

// ================= LAPORAN GLOBAL =================
router.get("/reports", verifyToken, getReports);

module.exports = router;