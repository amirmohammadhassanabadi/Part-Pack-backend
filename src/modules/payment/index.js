const express = require("express");
const paymentRouter = require("./routes/payment.routes");

const router = express.Router();
router.use("/", paymentRouter);

module.exports = router;
