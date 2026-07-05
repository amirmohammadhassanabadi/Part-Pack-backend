const express = require("express");
const router = express.Router();
const brandController = require("../controller/brand.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

router.get("/", brandController.getBrands);
router.get("/:id", brandController.getBrandById);

router.post("/", authenticate, authorize("admin", "operator"), brandController.createBrand);
router.put("/:id", authenticate, authorize("admin", "operator"), brandController.updateBrand);
router.delete("/:id", authenticate, authorize("admin", "operator"), brandController.deleteBrand);

module.exports = router;
