const express = require("express");
const router = express.Router();
const {
  assignCourier,
  completeDelivery,
} = require("../controllers/deliveryController");

router.post("/assign", assignCourier);
router.put("/:id/complete", completeDelivery);

module.exports = router;
