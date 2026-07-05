const express = require("express");
const router = express.Router();
const brandRouter = require("./routes/brand.routes");
const carModelRouter = require("./routes/carModel.routes");
const partCategoryRouter = require("./routes/partCategory.routes");

router.use("/brands", brandRouter);
router.use("/car-models", carModelRouter);
router.use("/part-categories", partCategoryRouter);

module.exports = router;
