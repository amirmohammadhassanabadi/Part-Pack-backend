const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { otpRateLimiter } = require("../../../core/middlewares/rateLimiter");
const {
  validateBody,
  validateOtpRequest,
  validateOtpVerification,
} = require("../../../core/validation/validate");

router.post(
  "/request-otp",
  otpRateLimiter,
  validateBody(validateOtpRequest),
  authController.requestOtp,
);
router.post(
  "/verify-otp",
  otpRateLimiter,
  validateBody(validateOtpVerification),
  authController.verifyOtp,
);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
// --------------------------------------------
router.post("/devlogin", authController.verifyDev);

module.exports = router;
