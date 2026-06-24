const express = require("express");
const router = express.Router();
const authRouter = require("./route/auth.route");

router.use("/", authRouter);

module.exports = router;