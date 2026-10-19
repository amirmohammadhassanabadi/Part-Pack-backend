const express = require("express");
const customerController = require("../controller/customer.controller");

const {
  authenticate,
  authorize,
  authorizeCustomerOwnership,
} = require("../../auth/middleware/auth.middleware");
const {
  validateBody,
  validateCustomer,
} = require("../../../core/validation/validate");

const router = express.Router();

// ============================================================
// Public
// ============================================================

// Customer registration
router.post(
  "/",
  validateBody(validateCustomer),
  customerController.createCustomer,
);

// ============================================================
// Admin + Operator
// ============================================================

// Get all customers
router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  customerController.getAllCustomers,
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
  customerController.getCustomerById,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "operator"),
  customerController.updateCustomerStatus,
);

// Add address
router.post(
  "/:id/addresses",
  authenticate,
  authorize("admin", "operator", "customer"),
  authorizeCustomerOwnership,
  customerController.addAddressToCustomer,
);

// Add car
router.post(
  "/:id/car-models",
  authenticate,
  authorize("admin", "operator", "customer"),
  authorizeCustomerOwnership,
  customerController.addCarToCustomer,
);

// Editing saved entries uses the same ownership checks as reading the profile.
for (const [path, update, remove] of [
  ["addresses", customerController.updateAddress, customerController.deleteAddress],
  ["car-models", customerController.updateCar, customerController.deleteCar],
]) {
  router.put(`/:id/${path}/:entryId`, authenticate, authorize("admin", "operator", "customer"), authorizeCustomerOwnership, update);
  router.delete(`/:id/${path}/:entryId`, authenticate, authorize("admin", "operator", "customer"), authorizeCustomerOwnership, remove);
}

// ============================================================
// Internal operations
// ============================================================

// addOrderToCustomer()
// addInvoiceToCustomer()
//
// These are not exposed as HTTP routes.

module.exports = router;
