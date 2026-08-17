const express = require("express");
const router = express.Router();

const invoiceRouter = require("./routes/invoice.routes");

router.use("/", invoiceRouter);

module.exports = router;