const express = require("express");
const supplierController = require("../controller/supplier.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("admin", "operator"),
  supplierController.createSupplier,
);
router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getSuppliers,
);
router.get(
  "/matching",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getMatchingSuppliers,
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getSupplierById,
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  supplierController.updateSupplier,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  supplierController.deleteSupplier,
);

router.post(
  "/:id/coverage",
  authenticate,
  authorize("admin", "operator"),
  supplierController.addCoverage,
);
router.put(
  "/:id/coverage/:brandId",
  authenticate,
  authorize("admin", "operator"),
  supplierController.replaceCoverage,
);
router.delete(
  "/:id/coverage/:brandId",
  authenticate,
  authorize("admin", "operator"),
  supplierController.removeCoverage,
);

module.exports = router;
