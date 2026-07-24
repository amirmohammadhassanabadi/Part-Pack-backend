const express = require("express");
const router = express.Router();
const staffRouter = require("./routes/staff.routes");

router.use("/", staffRouter);

module.exports = router;
