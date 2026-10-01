const express = require("express");
const invitationRouter = require("./routes/invitation.routes");

const router = express.Router();
router.use("/", invitationRouter);

module.exports = router;