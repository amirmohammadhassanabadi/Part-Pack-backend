const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { otpRateLimiter } = require("../../../core/middlewares/rateLimiter");

router.post("/request-otp", otpRateLimiter, authController.requestOtp);
router.post("/verify-otp", otpRateLimiter, authController.verifyOtp);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;