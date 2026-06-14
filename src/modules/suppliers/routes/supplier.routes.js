const express = require("express");
const supplierController = require("../controllers/supplier.controller");
const { validateSupplierCreate } = require("../middlewares/supplier.validator");

const router = express.Router();

router.post(
  "/register",
  validateSupplierCreate,
  supplierController.createSupplier,
);

// router.get("/", supplierController.getSuppliers);

// router.get("/:id", supplierController.getSupplierById);

// router.patch("/:id", supplierController.updateSupplier);

// router.delete("/:id", supplierController.deleteSupplier);

module.exports = router;
