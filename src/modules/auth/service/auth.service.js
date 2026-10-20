const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sessions = require("./session.service");
const Auth = require("../model/auth.model");
const { assertAccountReady } = require("../../accounts/service/account.service");
const { getRedisClient } = require("../../../core/database/redis");
const kavenegarService = require("../../../integrations/kavenegar/kavenegarService");

const { getAuthSettings } = require("../../settings");

const OTP_TTL = 120;
const OTP_MAX_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

async function requestOtp(phone, otpWay) {
  const redis = getRedisClient();
  const settings = await getAuthSettings();
  const otp = crypto.randomInt(100000, 1000000).toString();
  if (!await redis.set(`otp:${phone}`, otp, "EX", OTP_TTL, "NX")) {
    throw Object.assign(new Error("کد قبلاً ارسال شده؛ دو دقیقه صبر کنید."), { statusCode: 429 });
  }
  await redis.set(`otp_attempts:${phone}`, "0", "EX", OTP_TTL);
  await redis.set(`otp_delivery:${phone}`, settings.otpPreviewEnabled ? `preview:${settings.revision}` : "sms", "EX", OTP_TTL);
  try {
    if (!settings.otpPreviewEnabled) await kavenegarService.sendOtp(phone, otp, otpWay);
  } catch (error) {
    await redis.del(`otp:${phone}`, `otp_attempts:${phone}`, `otp_delivery:${phone}`);
    throw Object.assign(new Error("ارسال پیامک ناموفق بود؛ دوباره تلاش کنید."), { statusCode: 503 });
  }
  return { success: true, expiresIn: OTP_TTL, ...(settings.otpPreviewEnabled ? { otpPreview: otp } : {}) };
}

async function verifyOtp(phone, code, context = {}) {
  const redis = getRedisClient();

  const delivery = await redis.get(`otp_delivery:${phone}`);
  if (delivery?.startsWith("preview:")) {
    const settings = await getAuthSettings();
    if (!settings.otpPreviewEnabled || delivery !== `preview:${settings.revision}`) {
      await redis.del(`otp:${phone}`, `otp_attempts:${phone}`, `otp_delivery:${phone}`);
      throw Object.assign(new Error("کد منقضی شده؛ کد جدید درخواست کنید."), { statusCode: 400 });
    }
  }
  const verdict = await redis.eval(`
    local saved = redis.call('GET', KEYS[1])
    if not saved then return -1 end
    local attempts = tonumber(redis.call('GET', KEYS[2]) or '0')
    if attempts >= tonumber(ARGV[2]) then return -2 end
    if saved ~= ARGV[1] then redis.call('INCR', KEYS[2]); return 0 end
    redis.call('DEL', KEYS[1], KEYS[2], KEYS[3]); return 1
  `, 3, `otp:${phone}`, `otp_attempts:${phone}`, `otp_delivery:${phone}`, code, OTP_MAX_ATTEMPTS);
  if (verdict !== 1) throw Object.assign(new Error(verdict === -1 ? "OTP expired or not requested." : verdict === -2 ? "Too many failed attempts. Please request a new OTP." : "Invalid OTP code."), { statusCode: 400 });

  const authUser = await Auth.findOne({ phone });
  if (!authUser) {
    const registrationToken = crypto.randomBytes(32).toString("hex");
    await redis.set(`registration:${registrationToken}`, phone, "EX", 600);
    return { registered: false, registrationToken };
  }
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

  // A deactivation racing token issuance must not leave newly written refresh keys behind.
  await ensureStillActive(authUser, newRefreshToken);
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
    throw Object.assign(new Error("Session expired. Please login again."), { statusCode: 401 });
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

  await ensureStillActive(authUser, token);
  return { accessToken };
}

async function ensureStillActive(account, token) {
  const current = await Auth.findById(account._id).lean();
  if (!current?.isActive || current.role !== account.role || (current.sessionVersion || 0) !== (account.sessionVersion || 0)) {
    await sessions.closeToken(token);
    await getRedisClient().del(`refresh:${token}`, `refreshVersion:${token}`);
    throw Object.assign(new Error("حساب غیرفعال شده یا نشست پایان یافته است."), { statusCode: 401 });
  }
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

async function registerAccount(token, kind, payload, context = {}) {
  if (!["customer", "supplier"].includes(kind) || !/^[a-f0-9]{64}$/.test(token || "")) throw Object.assign(new Error("ابتدا کد یک‌بارمصرف را تأیید کنید."), { statusCode: 401 });
  const redis = getRedisClient();
  const phone = await redis.get(`registration:${token}`);
  if (!phone) throw Object.assign(new Error("تأیید شماره منقضی شده است؛ دوباره وارد شوید."), { statusCode: 401 });
  const identity = require("../../accounts/service/profile-completion").pickProfileFields(payload, kind);
  const data = kind === "customer"
    ? { ...identity, fullName: payload.fullName, phone, addresses: payload.addresses || [], carModels: payload.carModels || [] }
    : { ...identity, name: payload.name, contacts: { mobile: phone }, address: payload.address, coverageRules: payload.coverageRules || [] };
  if (kind === "customer") await require("../../customer/service/customer.service").createCustomer(data);
  else await require("../../suppliers/service/supplier.service").createSupplier(data);
  await redis.del(`registration:${token}`);
  return issueTokens(await Auth.findOne({ phone }), context);
}
module.exports = { requestOtp, verifyOtp, refreshToken, logout, registerAccount };
