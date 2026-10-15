const test = require("node:test");
const assert = require("node:assert/strict");
const { isLocalTestPhone, getLocalOtp } = require("../src/modules/auth/service/localAuth");

test("fixed OTP is limited to explicit development accounts", () => {
  const keys = ["NODE_ENV", "DEV_AUTH_ENABLED", "DEV_AUTH_PHONES", "DEV_LOGIN_CODE"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_ENABLED = "true";
    process.env.DEV_AUTH_PHONES = "09128498877,09128498878";
    process.env.DEV_LOGIN_CODE = "112233";
    assert.equal(getLocalOtp("09128498877"), "112233");
    assert.equal(isLocalTestPhone("09120000000"), false);
    assert.equal(getLocalOtp("09120000000"), null);
    process.env.NODE_ENV = "production";
    assert.equal(getLocalOtp("09128498877"), null);
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_ENABLED = "false";
    assert.equal(getLocalOtp("09128498877"), null);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
