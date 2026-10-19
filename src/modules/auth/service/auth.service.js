const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sessions = require("./session.service");
const Auth = require("../model/auth.model");
const { assertAccountReady } = require("../../accounts/service/account.service");
const { getRedisClient } = require("../../../core/database/redis");
const kavenegarService = require("../../../integrations/kavenegar/kavenegarService");

const { getLocalOtp, isLocalAuthEnabled, isLocalTestPhone } = require("./localAuth");

const OTP_TTL = 120;
const OTP_MAX_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

async function requestOtp(phone, otpWay) {
  const redis = getRedisClient();
  if (isLocalAuthEnabled() && !isLocalTestPhone(phone)) {
    const error = new Error("Only seeded test accounts are allowed in local mode; no SMS is sent.");
    error.statusCode = 400;
    throw error;
  }

  const existingOtp = await redis.get(`otp:${phone}`);
  if (existingOtp) {
    throw new Error(
      "OTP already sent. Please wait 2 minutes before requesting again.",
    );
  }

  const localOtp = getLocalOtp(phone);
  const otp = localOtp || crypto.randomInt(100000, 999999).toString();

  await redis.set(`otp:${phone}`, otp, "EX", OTP_TTL);
  await redis.set(`otp_attempts:${phone}`, "0", "EX", OTP_TTL);

  if (!localOtp) await kavenegarService.sendOtp(phone, otp, otpWay);

  return { success: true };
}

async function verifyOtp(phone, code, context = {}) {
  const redis = getRedisClient();

  const storedOtp = await redis.get(`otp:${phone}`);
  if (!storedOtp) {
    throw new Error("OTP expired or not requested.");
  }

  const attempts = parseInt(await redis.get(`otp_attempts:${phone}`)) || 0;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("Too many failed attempts. Please request a new OTP.");
  }

  if (storedOtp !== code) {
    await redis.incr(`otp_attempts:${phone}`);
    throw new Error("Invalid OTP code.");
  }

  await redis.del(`otp:${phone}`);
  await redis.del(`otp_attempts:${phone}`);

  const authUser = await Auth.findOne({ phone });
  if (!authUser) return { registered: false };
  if (!authUser.isActive) throw Object.assign(new Error("این حساب غیرفعال شده است؛ برای بررسی با پشتیبانی تماس بگیرید."), { statusCode: 403 });

  return issueTokens(authUser, context);
}

async function issueTokens(authUser, context = {}) {
  await assertAccountReady(authUser);
  const redis = getRedisClient();
  const newRefreshToken = crypto.randomBytes(64).toString("hex");
  const sid = await sessions.registerSession(newRefreshToken, authUser, context);
  const accessToken = jwt.sign(
    {
      userId: authUser.refId,
      role: authUser.role,
      refModel: authUser.refModel,
      sessionVersion: authUser.sessionVersion || 0,
      sid,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  // store Auth._id in Redis — used internally to re-fetch Auth document on refresh
  await redis.set(
    `refresh:${newRefreshToken}`,
    authUser._id.toString(),
    "EX",
    REFRESH_TOKEN_TTL,
  );

  await redis.set(`refreshVersion:${newRefreshToken}`, String(authUser.sessionVersion || 0), "EX", REFRESH_TOKEN_TTL);

  return {
    registered: true,
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      userId: authUser.refId,
      phone: authUser.phone,
      role: authUser.role,
      refModel: authUser.refModel,
      sessionVersion: authUser.sessionVersion || 0,
    },
  };
}

async function refreshToken(token, context = {}) {
  const redis = getRedisClient();

  if (await redis.get(`revokedSession:${sessions.sessionId(token)}`)) throw Object.assign(new Error("نشست این دستگاه پایان یافته است."), { statusCode: 401 });
  // retrieve Auth._id from Redis
  const authId = await redis.get(`refresh:${token}`);
  if (!authId) {
    throw new Error("Session expired. Please login again.");
  }

  // lookup Auth document by its own _id
  const authUser = await Auth.findOne({ _id: authId, isActive: true });
  if (!authUser) {
    throw Object.assign(new Error("User not found or deactivated."), { statusCode: 401 });
  }

  const savedVersion = Number(await redis.get(`refreshVersion:${token}`) || 0);
  if (savedVersion !== (authUser.sessionVersion || 0)) throw Object.assign(new Error("نشست پایان یافته است؛ دوباره وارد شوید."), { statusCode: 401 });
  await assertAccountReady(authUser);
  const ttl = await redis.ttl(`refresh:${token}`);
  if (ttl <= 0) throw Object.assign(new Error("نشست منقضی شده است."), { statusCode: 401 });
  const sid = await sessions.registerSession(token, authUser, context, ttl);

  const accessToken = jwt.sign(
    {
      userId: authUser.refId,
      role: authUser.role,
      refModel: authUser.refModel,
      sessionVersion: authUser.sessionVersion || 0,
      sid,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  return { accessToken };
}

async function logout(refreshToken) {
  const redis = getRedisClient();

  const authId = await redis.get(`refresh:${refreshToken}`);
  if (!authId) {
    throw new Error("Session not found or already logged out.");
  }

  await sessions.closeToken(refreshToken);
  await redis.del(`refresh:${refreshToken}`, `refreshVersion:${refreshToken}`);

  return { success: true };
}

async function devLogin(phone, code, context = {}) {
  if (isLocalTestPhone(phone)) {
    if (code !== getLocalOtp(phone)) throw new Error("Invalid OTP code.");
  } else {
    if (phone !== "09128498876") throw new Error("Phone number is wrong.");
    if (code !== "112233") throw new Error("Invalid OTP code.");
  }
  const authUser = await Auth.findOne({ phone, isActive: true });
  if (!authUser) throw new Error("Permission denied.");
  return issueTokens(authUser, context);
}

module.exports = { requestOtp, verifyOtp, refreshToken, logout, devLogin };
