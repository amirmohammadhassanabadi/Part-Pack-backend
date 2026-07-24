const express = require("express");
const router = express.Router();
const staffController = require("../controller/staff.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

router.get("/", authenticate, authorize("admin", "operator"), staffController.getAllStaff);
router.get("/:id", authenticate, authorize("admin", "operator"), staffController.getStaffById);
router.put("/:id", authenticate, authorize("admin", "operator"), staffController.updateStaff);
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "operator"),
  staffController.updateStaffStatus,
);

module.exports = router;
