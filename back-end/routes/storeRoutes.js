const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");

router.get("/", storeController.getStores);
router.post("/", storeController.createStore);
router.get("/:id/shipping-rates", storeController.getShippingRates);
router.get("/:id", storeController.getStoreById);

module.exports = router;
