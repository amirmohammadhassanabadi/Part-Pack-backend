const express = require("express");
const router = express.Router();
const authRouter = require("./routes/auth.route");

router.use("/", authRouter);

module.exports = router;