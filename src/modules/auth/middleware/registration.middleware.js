const { getRedisClient } = require("../../../core/database/redis");
const { authenticate, authorize } = require("./auth.middleware");
module.exports = async (req, res, next) => {
  if (req.headers.authorization) return authenticate(req, res, () => authorize("admin", "operator")(req, res, next));
  try {
    const token = req.get("x-registration-token");
    if (!/^[a-f0-9]{64}$/.test(token || "")) return res.status(401).json({ message: "ابتدا شماره موبایل را با کد یک‌بارمصرف تأیید کنید." });
    const phone = await getRedisClient().get(`registration:${token}`);
    const requested = req.body.phone || req.body.contacts?.mobile;
    if (!phone || requested !== phone) return res.status(401).json({ message: "تأیید شماره منقضی یا نامعتبر است." });
    req.registrationToken = token;
    next();
  } catch (error) { next(error); }
};
