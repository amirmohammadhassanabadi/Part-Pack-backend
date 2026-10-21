const express = require("express");

const {
  authenticate,
  authorize,
} = require("../auth/middleware/auth.middleware");

const router = express.Router();

router.get("/orders/:orderId/events", authenticate, authorize("operator", "admin"), (req, res) =>
  res.status(410).json({
    success: false,
    message: "Audit events are emitted to backend application logs and are not stored for API retrieval.",
  }),
);

module.exports = router;
