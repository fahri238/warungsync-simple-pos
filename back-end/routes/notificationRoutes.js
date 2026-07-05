const express = require("express");
const router = express.Router();
const { getNotifications, markAllAsRead } = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

// Harus login untuk akses ini
router.get("/", verifyToken, getNotifications);
router.put("/mark-read", verifyToken, markAllAsRead);

module.exports = router;