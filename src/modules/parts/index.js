const express = require("express");
const router = express.Router();
const partRouter = require("./routes/part.routes");

router.use("/", partRouter);

module.exports = router;