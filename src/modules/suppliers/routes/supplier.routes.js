const express = require("express");
const supplierController = require("../controller/supplier.controller");

const router = express.Router();

router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getSuppliers);
router.get("/matching", supplierController.getMatchingSuppliers);
router.get("/:id", supplierController.getSupplierById);
router.patch("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

router.post("/:id/coverage", supplierController.addCoverage);
router.put("/:id/coverage/:brandId", supplierController.replaceCoverage);
router.delete("/:id/coverage/:brandId", supplierController.removeCoverage);

module.exports = router;
