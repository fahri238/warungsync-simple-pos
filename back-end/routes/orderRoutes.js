const express = require("express");
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  getRevenueByChannel,
} = require("../controllers/orderController");

router.get("/", getOrders);
router.get("/analytics/revenue", getRevenueByChannel);
router.post("/", createOrder);
router.put("/:id/status", updateOrderStatus);

module.exports = router;
