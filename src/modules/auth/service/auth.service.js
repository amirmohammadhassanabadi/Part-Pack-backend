const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Auth = require("../model/auth.model");
const { getRedisClient } = require("../../../core/database/redis");
const smsService = require("../../../integrations/sms/smsService");

const OTP_TTL = 120; // 2 minutes in seconds
const OTP_MAX_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

async function requestOtp(phone, otpWay) {
  const redis = getRedisClient();

  const existingOtp = await redis.get(`otp:${phone}`);
  if (existingOtp) {
    throw new Error(
      "OTP already sent. Please wait 2 minutes before requesting again.",
    );
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await redis.set(`otp:${phone}`, otp, "EX", OTP_TTL);
  await redis.set(`otp_attempts:${phone}`, "0", "EX", OTP_TTL);

  await smsService.send(phone, otp, otpWay);

  return { success: true };
}

async function verifyOtp(phone, code) {
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

  const authUser = await Auth.findOne({ phone, isActive: true });

  if (!authUser) {
    return { registered: false };
  }

  const accessToken = jwt.sign(
    { userId: authUser._id, role: authUser.role, refModel: authUser.refModel },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  await redis.set(
    `refresh:${refreshToken}`,
    authUser._id.toString(),
    "EX",
    REFRESH_TOKEN_TTL,
  );

  return {
    registered: true,
    accessToken,
    refreshToken,
    user: {
      userId: authUser._id,
      role: authUser.role,
      refModel: authUser.refModel,
    },
  };
}

async function refreshToken(token) {
  const redis = getRedisClient();

  const userId = await redis.get(`refresh:${token}`);
  if (!userId) {
    throw new Error("Session expired. Please login again.");
  }

  const authUser = await Auth.findOne({ _id: userId, isActive: true });
  if (!authUser) {
    throw new Error("User not found or deactivated.");
  }

  const accessToken = jwt.sign(
    { userId: authUser._id, role: authUser.role, refModel: authUser.refModel },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  return { accessToken };
}

async function logout(refreshToken) {
  const redis = getRedisClient();

  const userId = await redis.get(`refresh:${refreshToken}`);
  if (!userId) {
    throw new Error("Session not found or already logged out.");
  }

  await redis.del(`refresh:${refreshToken}`);

  return { success: true };
}

module.exports = { requestOtp, verifyOtp, refreshToken, logout };