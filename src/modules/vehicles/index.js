const express = require("express");
const router = express.Router();
const brandRouter = require("./routes/brand.routes");
const carModelRouter = require("./routes/carModel.routes");

router.use("/brands", brandRouter);
router.use("/car-models", carModelRouter);

module.exports = router;
