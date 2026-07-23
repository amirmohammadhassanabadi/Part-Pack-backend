const express = require("express");
const router = express.Router();
const authRouter = require("./routes/supplier.routes");

router.use("/", authRouter);

module.exports = router;