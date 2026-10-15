require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const Redis = require("ioredis");

async function json(url, body, cookie) {
  const response = await fetch(url, { method: body ? "POST" : "GET", headers: {
    ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  assert.ok(response.ok, `${url}: ${response.status} ${data.message || ""}`);
  return { response, data };
}
(async () => {
  assert.equal(process.env.NODE_ENV, "development");
  const base = "http://127.0.0.1:3000/api";
  const redis = new Redis(process.env.REDIS_URL);
  try {
    for (const [phone, role] of [["09128498876", "admin"], ["09128498877", "customer"], ["09128498878", "supplier"]]) {
      if (role !== "admin") await json(`${base}/auth/request-otp`, { phone, otpWay: "sms" });
      const result = await json(`${base}/auth/${role === "admin" ? "devlogin" : "verify-otp"}`, { phone, code: "112233" });
      assert.equal(result.data.user.role, role);
      const cookies = result.response.headers.getSetCookie();
      assert.ok(cookies.every((value) => Buffer.byteLength(value) < 4096), "Cookie exceeds browser limits");
      const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
      const accessCookie = cookies.find((value) => value.startsWith("access_token="));
      const refreshCookie = cookies.find((value) => value.startsWith("refresh_token="));
      assert.ok(accessCookie && refreshCookie);
      assert.ok(/httponly/i.test(accessCookie));
      const access = decodeURIComponent(accessCookie.split(";")[0].slice("access_token=".length));
      const token = jwt.verify(access, process.env.JWT_ACCESS_SECRET);
      assert.equal(token.role, role);
      const refresh = decodeURIComponent(refreshCookie.split(";")[0].slice("refresh_token=".length));
      assert.ok(await redis.get(`refresh:${refresh}`));
      const response = await json(`${base}/auth/refresh`, {}, cookie);
      assert.ok(response.response.headers.getSetCookie().some((value) => value.startsWith("access_token=")));
      await json(`${base}/auth/logout`, {}, cookie);
      assert.equal(await redis.get(`refresh:${refresh}`), null);
      console.log(`${role}: fixed OTP, real JWT, HttpOnly cookies, Redis refresh and logout passed`);
    }
    const denied = await fetch(`${base}/auth/request-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "09120009999", otpWay: "sms" }) });
    assert.equal(denied.status, 400);
    console.log("Unknown local phone rejected without sending SMS");
  } finally { await redis.quit(); }
})().catch((error) => { console.error(error.message, error.cause?.code || ""); process.exitCode = 1; });
