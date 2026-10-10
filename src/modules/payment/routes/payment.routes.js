const express = require("express");
const paymentController = require("../controller/payment.controller");
const {
  authenticate,
  authorize,
} = require("../../auth/middleware/auth.middleware");

const router = express.Router();

router.post(
  "/orders/:orderId/session",
  authenticate,
  authorize("customer"),
  paymentController.createSession,
);
router.get(
  "/:id",
  authenticate,
  authorize("customer"),
  paymentController.getPayment,
);

module.exports = router;
