const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const { verifyToken } = require("../middleware/authMiddleware");

// ================= PUBLIC ROUTES =================
router.get("/", storeController.getStores);
router.get("/list", storeController.getStores);
router.get("/:id", storeController.getStoreById);

// Endpoint GET untuk Publik (Dibutuhkan saat Checkout)
router.get("/:storeId/shipping-rates", storeController.getShippingRates);
router.get("/:storeId/banks", storeController.getBankAccounts);

// ================= PROTECTED ROUTES (OWNER/ADMIN) =================
router.post("/", verifyToken, storeController.createStore);

// CRUD Wilayah Pengiriman (Ongkir)
router.post(
  "/:storeId/shipping-rates",
  verifyToken,
  storeController.addShippingRate,
);
router.delete(
  "/shipping-rates/:id",
  verifyToken,
  storeController.deleteShippingRate,
);

// CRUD Rekening Bank
router.post("/:storeId/banks", verifyToken, storeController.addBankAccount);
router.delete("/banks/:id", verifyToken, storeController.deleteBankAccount);

module.exports = router;
