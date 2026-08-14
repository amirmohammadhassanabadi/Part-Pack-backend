const express = require("express");
const customerController = require("../controller/customer.controller");

const {
  authenticate,
  authorize,
  authorizeCustomerOwnership,
} = require("../../auth/middleware/auth.middleware");

const router = express.Router();


// ============================================================
// Public
// ============================================================

// Customer registration
router.post(
  "/",
  customerController.createCustomer
);


// ============================================================
// Admin + Operator
// ============================================================

// Get all customers
router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  customerController.getAllCustomers
);


// ============================================================
// Admin + Operator + Customer
// ============================================================

// Get customer by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "operator", "customer"),
  authorizeCustomerOwnership,
  customerController.getCustomerById
);


// Add address
router.post(
  "/:id/addresses",
  authenticate,
  authorize("admin", "operator", "customer"),
  authorizeCustomerOwnership,
  customerController.addAddressToCustomer
);


// Add car
router.post(
  "/:id/car-models",
  authenticate,
  authorize("admin", "operator", "customer"),
  authorizeCustomerOwnership,
  customerController.addCarToCustomer
);


// ============================================================
// Internal operations
// ============================================================

// addOrderToCustomer()
// addInvoiceToCustomer()
//
// These are not exposed as HTTP routes.


module.exports = router;