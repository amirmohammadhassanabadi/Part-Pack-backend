const express = require("express");
const router = express.Router();
const partCategoryController = require("../controller/partCategory.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

router.get("/", partCategoryController.getPartCategories);
router.get("/:id", partCategoryController.getPartCategoryById);

router.post("/", authenticate, authorize("admin", "operator"), partCategoryController.createPartCategory);
router.put("/:id", authenticate, authorize("admin", "operator"), partCategoryController.updatePartCategory);
router.delete("/:id", authenticate, authorize("admin", "operator"), partCategoryController.deletePartCategory);

module.exports = router;