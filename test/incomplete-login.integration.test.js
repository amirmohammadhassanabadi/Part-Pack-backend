const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Customer = require("../src/modules/customer/model/customer.model");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const Auth = require("../src/modules/auth/model/auth.model");
const accounts = require("../src/modules/accounts/service/account.service");

test("incomplete customers and suppliers log in, complete their own profile and retain order restrictions until then", { skip: !process.env.PROFILE_TEST_MONGO_URL || !process.env.FEATURE_TEST_REDIS_URL }, async (t) => {
  await mongoose.connect(process.env.PROFILE_TEST_MONGO_URL, { dbName: `incomplete_login_${crypto.randomBytes(8).toString("hex")}` });
  const oldSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString("hex");
  const redisModule = require("../src/core/database/redis");
  const originalRedis = redisModule.getRedisClient;
  const redis = new (require("ioredis"))(process.env.FEATURE_TEST_REDIS_URL);
  redisModule.getRedisClient = () => redis;
  t.after(() => redis.quit());
  t.after(async () => {
    redisModule.getRedisClient = originalRedis;
    if (oldSecret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = oldSecret;
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  });
  await Promise.all([Customer.init(), Supplier.init(), Auth.init()]);
  const express = require("express"), app = express();
  app.use(express.json());
  app.use("/auth", require("../src/modules/auth/routes/auth.routes"));
  app.use("/users", require("../src/modules/accounts"));
  app.use("/orders", require("../src/modules/orders/routes/order.routes"));
  app.use(require("../src/core/middlewares/errorHandler"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const request = async (path, method = "GET", body, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body && JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  const login = async (phone) => {
    await redis.set(`otp:${phone}`, "123456");
    return request("/auth/verify-otp", "POST", { phone, code: "123456" });
  };
  for (const [kind, Model, phone] of [["customer", Customer, "09120000071"], ["supplier", Supplier, "09120000072"]]) {
    await t.test(`${kind}: OTP and refresh allow missing name/mobile, completion persists safely`, async () => {
      const profile = await accounts.createAccount(kind, kind === "customer" ? { fullName: "Legacy", phone } : { name: "Legacy", contacts: { mobile: phone } });
      const nameField = kind === "customer" ? "fullName" : "name";
      const phoneField = kind === "customer" ? "phone" : "contacts.mobile";
      // Simulate a previously stored record. New account creation remains strictly validated.
      await Model.collection.updateOne({ _id: profile._id }, { $unset: { [nameField]: "", [phoneField]: "" } });
      const loggedIn = await login(phone);
      assert.equal(loggedIn.status, 200);
      assert.equal(loggedIn.body.user.phone, phone);
      assert.equal(loggedIn.body.user.role, kind);
      assert.equal(String(loggedIn.body.user.userId), String(profile._id));
      const refreshed = await request("/auth/refresh", "POST", { refreshToken: loggedIn.body.refreshToken });
      assert.equal(refreshed.status, 200);
      assert.equal(jwt.verify(refreshed.body.accessToken, process.env.JWT_ACCESS_SECRET).role, kind);
      const token = refreshed.body.accessToken;
      const own = await request("/users/me/profile", "GET", undefined, token);
      assert.equal(own.status, 200); assert.equal(own.body.completion.complete, false);
      assert.equal(String(own.body.profile._id), String(profile._id));
      assert.equal((await request("/users", "GET", undefined, token)).status, 403, "login must not grant admin access");
      if (kind === "customer") {
        for (const item of [{ partId: String(new mongoose.Types.ObjectId()), qty: 1 }, { bundleId: String(new mongoose.Types.ObjectId()), qty: 1 }]) {
          const blocked = await request("/orders", "POST", { items: [item] }, token);
          assert.equal(blocked.status, 403); assert.equal(blocked.body.code, "PROFILE_INCOMPLETE");
        }
      }
      const saved = await request("/users/me/profile", "PATCH", { [nameField]: "Completed", nationalCode: "1234567891", phone: "09120000999", role: "admin" }, token);
      assert.equal(saved.status, 200); assert.equal(saved.body.completion.complete, true);
      const stored = await Model.findById(profile._id);
      assert.equal(stored.get(phoneField), phone, "the login mobile is restored from the linked account, never from user input");
      assert.equal((await request("/users/me/profile", "GET", undefined, token)).body.completion.complete, true);
      const auth = await Auth.findOne({ refId: profile._id });
      assert.equal(auth.role, kind); assert.equal(auth.phone, phone);
      await Model.collection.updateOne({ _id: profile._id }, { $set: { [phoneField]: "09120000999" } });
      assert.equal((await login(phone)).status, 403, "a different valid identity must still be rejected");
      assert.equal((await request("/auth/refresh", "POST", { refreshToken: loggedIn.body.refreshToken })).status, 403);
      await Model.collection.updateOne({ _id: profile._id }, { $set: { [phoneField]: phone, isActive: false } });
      assert.equal((await login(phone)).status, 403, "inactive accounts must remain blocked");
    });
  }
});
