const rateLimit = require("express-rate-limit");
const { isLocalTestPhone } = require("../../modules/auth/service/localAuth");

const otpRateLimiter = rateLimit({
  skip: (req) => isLocalTestPhone(req.body?.phone),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                    // max 5 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

module.exports = { otpRateLimiter };