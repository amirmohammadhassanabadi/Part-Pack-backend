const express = require("express");

const auditService = require("./service/audit.service");
const { authenticate, authorize } = require("../auth/middleware/auth.middleware");

const router = express.Router();

router.get(
  "/orders/:orderId/events",
  authenticate,
  authorize("operator", "admin"),
  async (req, res, next) => {
    try {
      const events = await auditService.getOrderEvents(req.params.orderId);
      return res.status(200).json({ success: true, data: events });
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = router;
