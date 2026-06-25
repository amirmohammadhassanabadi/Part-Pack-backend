const express = require("express");
const router = express.Router();
const brandRouter = require("./routes/brand.routes");

router.use("/brands", brandRouter);

module.exports = router;
