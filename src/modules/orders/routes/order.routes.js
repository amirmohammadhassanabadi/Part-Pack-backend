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

const requireCompletion = require("../../accounts/middleware/profile-completion");
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

router.get(
  "/my-orders/:id/offers",
  authenticate,
  authorize("customer"),
  orderController.getCustomerOfferBoard,
);

router.post(
  "/my-orders/:id/select-offers",
  authenticate,
  authorize("customer"),
  requireCompletion,
  orderController.selectCustomerOffers,
);

router.post(
  "/my-orders/:id/checkout",
  authenticate,
  authorize("customer"),
  requireCompletion,
  orderController.prepareCheckout,
);

// Get orders for operator dashboard
router.get(
  "/operator",
  authenticate,
  authorize("admin", "operator"),
  orderController.getOperatorOrders,
);

// Review supplier invitations and offers
router.get(
  "/operator/:id/invitations",
  authenticate,
  authorize("admin", "operator"),
  orderController.getOperatorOrderInvitations,
);

router.get(
  "/operator/:id/offers",
  authenticate,
  authorize("admin", "operator"),
  orderController.getOperatorOfferBoard,
);

// Add an offer supplied directly by the operator.
router.post(
  "/operator/:id/offers",
  authenticate,
  authorize("admin", "operator"),
  orderController.createOperatorOffer,
);

// Apply markup and publish the selected offers for customer selection.
router.post(
  "/operator/:id/shortlist-offers",
  authenticate,
  authorize("admin", "operator"),
  orderController.shortlistOffers,
);

// Select one supplier offer per item, or mark an item unavailable
router.post(
  "/operator/:id/select-offers",
  authenticate,
  authorize("admin", "operator"),
  validateBody(validateSelectOffers),
  orderController.selectOrderOffers,
);
// Get one order
router.get(
  "/operator/:id",
  authenticate,
  authorize("admin", "operator"),
  orderController.getOperatorOrderById,
);

// Confirm order after customer agrees
router.post(
  "/operator/:id/confirm",
  authenticate,
  authorize("admin", "operator"),
  orderController.confirmOrder,
);

// Cancel order
router.post(
  "/operator/:id/cancel",
  authenticate,
  authorize("admin", "operator"),
  orderController.cancelOrder,
);

module.exports = router;
