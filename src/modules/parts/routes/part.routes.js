const express = require("express");
const router = express.Router();
const partController = require("../controller/part.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

router.get("/", partController.getParts);
router.get("/:id", partController.getPartById);

router.post("/", authenticate, authorize("admin", "operator"), partController.createPart);
router.put("/:id", authenticate, authorize("admin", "operator"), partController.updatePart);
router.delete("/:id", authenticate, authorize("admin", "operator"), partController.deletePart);

router.post("/:id/compatibility/add", authenticate, authorize("admin", "operator"), partController.addCompatibility);
router.post("/:id/compatibility/remove", authenticate, authorize("admin", "operator"), partController.removeCompatibility);

module.exports = router;