const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Auth = require("../model/auth.model");
const { getRedisClient } = require("../../../core/database/redis");
const kavenegarService = require("../../../integrations/kavenegar/kavenegarService");

const OTP_TTL = 120;
const OTP_MAX_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

async function requestOtp(phone, otpWay) {
  const redis = getRedisClient();

  const existingOtp = await redis.get(`otp:${phone}`);
  if (existingOtp) {
    throw new Error("OTP already sent. Please wait 2 minutes before requesting again.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await redis.set(`otp:${phone}`, otp, "EX", OTP_TTL);
  await redis.set(`otp_attempts:${phone}`, "0", "EX", OTP_TTL);

  await kavenegarService.sendOtp(phone, otp, otpWay);

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
    { userId: authUser.refId, role: authUser.role, refModel: authUser.refModel },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const newRefreshToken = crypto.randomBytes(64).toString("hex");

  // store Auth._id in Redis — used internally to re-fetch Auth document on refresh
  await redis.set(`refresh:${newRefreshToken}`, authUser._id.toString(), "EX", REFRESH_TOKEN_TTL);

  return {
    registered: true,
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      userId: authUser.refId,
      role: authUser.role,
      refModel: authUser.refModel,
    },
  };
}

async function refreshToken(token) {
  const redis = getRedisClient();

  // retrieve Auth._id from Redis
  const authId = await redis.get(`refresh:${token}`);
  if (!authId) {
    throw new Error("Session expired. Please login again.");
  }

  // lookup Auth document by its own _id
  const authUser = await Auth.findOne({ _id: authId, isActive: true });
  if (!authUser) {
    throw new Error("User not found or deactivated.");
  }

  const accessToken = jwt.sign(
    { userId: authUser.refId, role: authUser.role, refModel: authUser.refModel },
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

  await redis.del(`refresh:${refreshToken}`);

  return { success: true };
}

async function devLogin(phone, code) {
  if (phone !== "09128498876") throw new Error("Phone number is wrong.");
  if (code !== "1122") throw new Error("Invalid OTP code.");

  const authUser = await Auth.findOne({ phone, isActive: true });
  if (!authUser) throw new Error("Permission denied.");

  const accessToken = jwt.sign(
    { userId: authUser.refId, role: authUser.role, refModel: authUser.refModel },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "30d" },
  );

  return {
    accessToken,
    user: {
      userId: authUser.refId,
      role: authUser.role,
      refModel: authUser.refModel,
    },
  };
}

module.exports = { requestOtp, verifyOtp, refreshToken, logout, devLogin };