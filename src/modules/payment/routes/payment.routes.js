const express = require("express");
const paymentController = require("../controller/payment.controller");
const {
  authenticate,
  authorize,
} = require("../../auth/middleware/auth.middleware");

const requireCompletion = require("../../accounts/middleware/profile-completion");
const router = express.Router();

router.post(
  "/orders/:orderId/session",
  authenticate,
  authorize("customer"),
  requireCompletion,
  paymentController.createSession,
);
router.get(
  "/:id",
  authenticate,
  authorize("customer"),
  paymentController.getPayment,
);

module.exports = router;
