const express = require("express");
const router = express.Router();
const customerRouter = require("./routes/customer.routes");

router.use("/", customerRouter);

module.exports = router;