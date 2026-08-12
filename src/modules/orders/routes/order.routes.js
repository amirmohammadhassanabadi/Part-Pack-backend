const express = require("express");

const orderController = require("../controller/order.controller");
const {
  authenticate,
  authorize,
} = require("../../auth/middleware/auth.middleware");

const router = express.Router();

// ============================================================
// Customer
// ============================================================

// Create order
router.post(
  "/",
  authenticate,
  authorize("customer"),
  orderController.createOrder
);

// Get customer's orders
router.get(
  "/my-orders",
  authenticate,
  authorize("customer"),
  orderController.getCustomerOrders
);

// Get one customer's order
router.get(
  "/my-orders/:id",
  authenticate,
  authorize("customer"),
  orderController.getCustomerOrderById
);

// ============================================================
// Operator
// ============================================================

// Get orders for operator dashboard
router.get(
  "/operator",
  authenticate,
  authorize("operator"),
  orderController.getOperatorOrders
);

// Get one order
router.get(
  "/operator/:id",
  authenticate,
  authorize("operator"),
  orderController.getOperatorOrderById
);

// Start processing an order
router.post(
  "/operator/:id/start-quoting",
  authenticate,
  authorize("operator"),
  orderController.startQuoting
);

// Update availability / price of an item
router.patch(
  "/operator/:id/items/:itemIndex",
  authenticate,
  authorize("operator"),
  orderController.updateOrderItemPricing
);

// Submit quotation
router.post(
  "/operator/:id/submit-quote",
  authenticate,
  authorize("operator"),
  orderController.submitQuote
);

// Confirm order after customer agrees
router.post(
  "/operator/:id/confirm",
  authenticate,
  authorize("operator"),
  orderController.confirmOrder
);

// Cancel order
router.post(
  "/operator/:id/cancel",
  authenticate,
  authorize("operator"),
  orderController.cancelOrder
);

module.exports = router;