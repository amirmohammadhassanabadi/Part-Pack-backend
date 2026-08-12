const express = require("express");

const router = express.Router();

const orderRouter = require("./routes/order.routes");

router.use("/", orderRouter);

module.exports = router;