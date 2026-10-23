const authService = require("../service/auth.service");
const { writeAuditLog } = require("../../audit/service/audit.service");

function tokenActor(token) {
  try {
    const claims = require("jsonwebtoken").decode(token);
    return { actorId: claims?.userId || null, actorRole: claims?.role || null, sessionId: claims?.sid || null };
  } catch { return {}; }
}

async function requestOtp(req, res, next) {
  try {
    const { phone, otpWay } = req.body;
    const result = await authService.requestOtp(phone, otpWay);
    await writeAuditLog({ timestamp: new Date().toISOString(), level: "info", event: "authentication_audit", type: "otp_delivery_requested", correlationId: req.correlationId, phoneLast4: String(phone || "").replace(/\D/g, "").slice(-4), channel: otpWay || "default" });
    res.set("Cache-Control", "no-store").status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { phone, code } = req.body;
    const result = await authService.verifyOtp(phone, code, { userAgent: req.get("user-agent"), deviceId: req.get("x-device-id"), ipAddress: req.get("x-client-ip") });
    await writeAuditLog({ timestamp: new Date().toISOString(), level: "info", event: "authentication_audit", type: result.registered ? "authentication_succeeded" : "otp_verified_registration_required", correlationId: req.correlationId, phoneLast4: String(phone || "").replace(/\D/g, "").slice(-4), ...(result.registered ? tokenActor(result.accessToken) : {}) });

    if (!result.registered) {
      return res.status(200).json({ registered: false, registrationToken: result.registrationToken });
    }

    res.status(200).json({
      registered: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.body?.refreshToken || req.headers["x-refresh-token"];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided." });
    }

    const result = await authService.refreshToken(token, { userAgent: req.get("user-agent"), deviceId: req.get("x-device-id"), ipAddress: req.get("x-client-ip") });
    await writeAuditLog({ timestamp: new Date().toISOString(), level: "info", event: "authentication_audit", type: "session_refreshed", correlationId: req.correlationId, ...tokenActor(result.accessToken) });

    res.status(200).json({ success: true, accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.body?.refreshToken || req.headers["x-refresh-token"];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided." });
    }

    const result = await authService.logout(token);
    await writeAuditLog({ timestamp: new Date().toISOString(), level: "info", event: "authentication_audit", type: "session_logged_out", correlationId: req.correlationId, actorId: result.actorId || null, actorRole: result.actorRole || null });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}
module.exports = { requestOtp, verifyOtp, refreshToken, logout };
