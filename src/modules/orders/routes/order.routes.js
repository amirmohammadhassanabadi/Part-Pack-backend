const express = require("express");

const orderController = require("../controller/order.controller");
const {
  authenticate,
  authorize,
} = require("../../auth/middleware/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a new order
 *     description: Creates a new order for the authenticated customer.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateOrderRequest"
 *
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *
 *       400:
 *         description: Invalid order data.
 *
 *       401:
 *         description: Authentication required.
 */

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