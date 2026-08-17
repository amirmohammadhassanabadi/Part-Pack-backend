const express = require("express");
const invoiceController = require("../controller/invoice.controller");
const {
  authenticate,
  authorize,
} = require("../../auth/middleware/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  invoiceController.getInvoices,
);

router.get(
  "/order/:orderId",
  authenticate,
  authorize("admin", "operator"),
  invoiceController.getInvoiceByOrderId,
);

router.get(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  invoiceController.getInvoiceById,
);

router.patch(
  "/:id/pay",
  authenticate,
  authorize("admin", "operator"),
  invoiceController.markInvoiceAsPaid,
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorize("admin", "operator"),
  invoiceController.cancelInvoice,
);

module.exports = router;