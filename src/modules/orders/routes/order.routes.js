const express = require("express");

const orderController = require("../controller/order.controller");
const {
  authenticate,
  authorize,
} = require("../../auth/middleware/auth.middleware");
const {
  validateBody,
  validateCreateOrder,
  validateSelectOffers,
} = require("../../../core/validation/validate");

const router = express.Router();

// Create order
router.post(
  "/",
  authenticate,
  authorize("customer"),
  validateBody(validateCreateOrder),
  orderController.createOrder,
);

// Get customer's orders
router.get(
  "/my-orders",
  authenticate,
  authorize("customer"),
  orderController.getCustomerOrders,
);

// Get one customer's order
router.get(
  "/my-orders/:id",
  authenticate,
  authorize("customer"),
  orderController.getCustomerOrderById,
);

// Get orders for operator dashboard
router.get(
  "/operator",
  authenticate,
  authorize("operator"),
  orderController.getOperatorOrders,
);

// Review supplier invitations and offers
router.get(
  "/operator/:id/invitations",
  authenticate,
  authorize("operator"),
  orderController.getOperatorOrderInvitations,
);

router.get(
  "/operator/:id/offers",
  authenticate,
  authorize("operator"),
  orderController.getOperatorOfferBoard,
);

// Select one supplier offer per item, or mark an item unavailable
router.post(
  "/operator/:id/select-offers",
  authenticate,
  authorize("operator"),
  validateBody(validateSelectOffers),
  orderController.selectOrderOffers,
);
// Get one order
router.get(
  "/operator/:id",
  authenticate,
  authorize("operator"),
  orderController.getOperatorOrderById,
);

// Confirm order after customer agrees
router.post(
  "/operator/:id/confirm",
  authenticate,
  authorize("operator"),
  orderController.confirmOrder,
);

// Cancel order
router.post(
  "/operator/:id/cancel",
  authenticate,
  authorize("operator"),
  orderController.cancelOrder,
);

module.exports = router;
