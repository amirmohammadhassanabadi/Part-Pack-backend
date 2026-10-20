const authService = require("../service/auth.service");

async function requestOtp(req, res, next) {
  try {
    const { phone, otpWay } = req.body;
    const result = await authService.requestOtp(phone, otpWay);
    res.set("Cache-Control", "no-store").status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { phone, code } = req.body;
    const result = await authService.verifyOtp(phone, code, { userAgent: req.get("user-agent") });

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

    const result = await authService.refreshToken(token, { userAgent: req.get("user-agent") });

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

    await authService.logout(token);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}
module.exports = { requestOtp, verifyOtp, refreshToken, logout };
