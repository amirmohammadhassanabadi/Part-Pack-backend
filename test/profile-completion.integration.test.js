const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Customer = require("../src/modules/customer/model/customer.model");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const Auth = require("../src/modules/auth/model/auth.model");
const service = require("../src/modules/accounts/service/account.service");
const { requireCompleteProfile } = require("../src/modules/accounts/service/profile-completion");

test("profile completion, admin editing and self-service persist on an isolated database", { skip: !process.env.PROFILE_TEST_MONGO_URL }, async (t) => {
  await mongoose.connect(process.env.PROFILE_TEST_MONGO_URL, { dbName: `profile_completion_${crypto.randomBytes(8).toString("hex")}`, serverSelectionTimeoutMS: 5000 });
  const oldSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString("hex");
  t.after(async () => {
    if (oldSecret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = oldSecret;
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  });
  await Promise.all([Customer.init(), Supplier.init(), Auth.init()]);
  const customer = await service.createAccount("customer", { fullName: "Customer", phone: "09120000001", addresses: [{ title: "Home", province: "Tehran", city: "Tehran", line: "Old address" }] });
  const supplier = await service.createAccount("supplier", { name: "Supplier", contacts: { mobile: "09120000002" } });
  const admin = await service.createAccount("staff", { fullName: "Admin", phone: "09120000888", role: "admin" });
  const express = require("express");
  const app = express(); app.use(express.json());
  app.use("/users", require("../src/modules/accounts"));
  app.use("/orders", require("../src/modules/orders/routes/order.routes"));
  app.use(require("../src/core/middlewares/errorHandler"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise((resolve) => server.close(resolve)); });
  const request = async (path, role, userId, method = "GET", data) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt.sign({ role, userId: String(userId) }, process.env.JWT_ACCESS_SECRET)}` }, body: data ? JSON.stringify(data) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
  await t.test("legacy login remains possible but order and bundle creation are blocked", async () => {
    await service.assertAccountReady(await Auth.findOne({ refId: customer._id }));
    const profile = await request("/users/me/profile", "customer", customer._id);
    assert.equal(profile.body.completion.complete, false);
    for (const item of [{ partId: String(new mongoose.Types.ObjectId()), qty: 1 }, { bundleId: String(new mongoose.Types.ObjectId()), qty: 1 }]) {
      const rejected = await request("/orders", "customer", customer._id, "POST", { items: [item] });
      assert.equal(rejected.status, 403); assert.equal(rejected.body.code, "PROFILE_INCOMPLETE");
    }
    assert.equal((await request("/users/me/profile", "admin", admin._id)).status, 403);
  });
  await t.test("invalid codes fail without damaging the saved profile; valid completion survives reloading", async () => {
    const invalid = await request("/users/me/profile", "customer", customer._id, "PATCH", { nationalCode: "0000000000", fullName: "Should not persist" });
    assert.equal(invalid.status, 400);
    assert.equal((await Customer.findById(customer._id)).fullName, "Customer");
    const updated = await request("/users/me/profile", "customer", customer._id, "PATCH", {
      fullName: "Customer updated", nationalCode: "۱۲۳۴۵۶۷۸۹۱", phone: supplier.contacts.mobile, role: "admin", isActive: false,
      email: "user@example.test", birthDate: "۱۳۷۰/۰۱/۰۱", accessibility: { wheelchair: true, hearingImpairment: false },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.completion.complete, true);
    const stored = await request("/users/me/profile", "customer", customer._id);
    assert.equal(stored.body.profile.phone, customer.phone);
    assert.equal(stored.body.profile.isActive, true);
    assert.equal(stored.body.profile.role, "customer");
    assert.equal(stored.body.profile.nationalCode, "1234567891");
    assert.equal(stored.body.profile.birthDate, "1370/01/01");
    assert.equal(stored.body.profile.addresses[0].line, "Old address");
    assert.equal(stored.body.profile.accessibility.wheelchair, true);
    await requireCompleteProfile("customer", customer._id);
  });
  await t.test("legal supplier can complete itself and admin can edit identity and accessibility", async () => {
    const updated = await request("/users/me/profile", "supplier", supplier._id, "PATCH", { personType: "legal", economicCode: "۱۲۳۴۵۶۷۸۹۰۱۲", accessibility: { visualImpairment: true } });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.completion.complete, true);
    await requireCompleteProfile("supplier", supplier._id);
    const byAdmin = await request(`/users/supplier/${supplier._id}`, "admin", admin._id, "PATCH", {
      fullName: "Admin edited", personType: "individual", nationalCode: "1234567891", accessibility: { visualImpairment: false },
    });
    assert.equal(byAdmin.status, 200);
    const saved = await Supplier.findById(supplier._id);
    assert.equal(saved.name, "Admin edited"); assert.equal(saved.accessibility.visualImpairment, false);
    assert.equal(saved.contacts.mobile, supplier.contacts.mobile);
    const rows = (await request("/users", "admin", admin._id)).body;
    assert.ok(rows.every((row) => row.integrity.complete));
    assert.equal((await request(`/users/supplier/${supplier._id}`, "customer", customer._id, "PATCH", { nationalCode: "1234567891" })).status, 403);
  });
});
