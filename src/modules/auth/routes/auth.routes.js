const express = require("express");
const router = express.Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
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
router.post("/register", otpRateLimiter, async (req, res, next) => {
  try {
    const result = await require("../service/auth.service").registerAccount(req.get("x-registration-token"), req.body.role, req.body, { userAgent: req.get("user-agent") });
    const actor = result?.user || {};
    await require("../../audit/service/audit.service").writeAuditLog({ timestamp: new Date().toISOString(), level: "info", event: "authentication_audit", type: "account_registered", correlationId: req.correlationId, actorId: actor.userId || null, actorRole: actor.role || req.body.role || null });
    res.set("Cache-Control", "no-store").status(201).json(result);
  } catch (error) { next(error); }
});
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
// --------------------------------------------


const { authenticate } = require("../middleware/auth.middleware");
const Auth = require("../model/auth.model");
const sessions = require("../service/session.service");
async function sessionOwner(req) {
  const account = await Auth.findOne({ refId: req.user.userId, role: req.user.role, isActive: true });
  if (!account) throw Object.assign(new Error("حساب پیدا نشد."), { statusCode: 401 });
  return account;
}
const currentSession = (req) => req.user.sid || (req.get("x-refresh-token") ? sessions.sessionId(req.get("x-refresh-token")) : null);
router.get("/sessions", authenticate, async (req, res, next) => {
  try { res.set("Cache-Control", "no-store").json({ data: await sessions.listSessions(await sessionOwner(req), currentSession(req)) }); } catch (error) { next(error); }
});
router.delete("/sessions/:id", authenticate, async (req, res, next) => {
  try { await sessions.revokeSession(await sessionOwner(req), req.params.id); res.json({ success: true, current: req.params.id === currentSession(req) }); } catch (error) { next(error); }
});
router.delete("/sessions", authenticate, async (req, res, next) => {
  try {
    const account = await sessionOwner(req), current = currentSession(req);
    if (!current) return res.status(400).json({ message: "نشست فعلی مشخص نیست؛ دوباره وارد شوید." });
    for (const item of await sessions.listSessions(account, current)) if (!item.current) await sessions.revokeSession(account, item.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});
module.exports = router;
