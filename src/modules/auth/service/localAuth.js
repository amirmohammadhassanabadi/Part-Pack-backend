function isLocalAuthEnabled() {
  return (process.env.NODE_ENV === "development" && process.env.DEV_AUTH_ENABLED === "true")
    || process.env.TEST_AUTH_ENABLED === "true";
}

function isLocalTestPhone(phone) {
  if (!isLocalAuthEnabled()) return false;
  return (process.env.DEV_AUTH_PHONES || "").split(",").map((value) => value.trim()).includes(phone);
}

function getLocalOtp(phone) {
  if (!isLocalTestPhone(phone)) return null;
  const code = process.env.DEV_LOGIN_CODE;
  if (!/^\d{6}$/.test(code || "")) throw new Error("DEV_LOGIN_CODE must contain six digits");
  return code;
}

module.exports = { isLocalAuthEnabled, isLocalTestPhone, getLocalOtp };
