const express = require("express");
const router = express.Router();
const carModelController = require("../controller/carModel.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

router.get("/", carModelController.getCarModels);
router.get("/:id", carModelController.getCarModelById);

router.post("/", authenticate, authorize("admin", "operator"), carModelController.createCarModel);
router.put("/:id", authenticate, authorize("admin", "operator"), carModelController.updateCarModel);
router.delete("/:id", authenticate, authorize("admin", "operator"), carModelController.deleteCarModel);

module.exports = router;