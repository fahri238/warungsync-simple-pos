const express = require("express");
const router = express.Router();
const {
  getStores,
  getStoreById,
  getStoreBySlug,
  createStore,
  updateStore,
  getShippingRates,
  upsertShippingRate,
} = require("../controllers/storeController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public
router.get("/", getStores);
router.get("/slug/:slug", getStoreBySlug);
router.get("/:id", getStoreById);
router.get("/:id/shipping-rates", getShippingRates);

// Protected
router.post("/", verifyToken, createStore);
router.put("/:id", verifyToken, updateStore);
router.post("/:id/shipping-rates", verifyToken, upsertShippingRate);

module.exports = router;
