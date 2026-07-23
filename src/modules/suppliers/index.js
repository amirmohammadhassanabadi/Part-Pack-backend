const express = require("express");
const router = express.Router();
const supplierRouter = require("./routes/supplier.routes");

router.use("/", supplierRouter);

module.exports = router;