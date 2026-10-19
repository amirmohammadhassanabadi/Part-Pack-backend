const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Customer = require("../src/modules/customer/model/customer.model");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const { completionStatus, pickProfileFields, requireCompleteProfile, validNationalCode } = require("../src/modules/accounts/service/profile-completion");
const accounts = require("../src/modules/accounts/service/account.service");
const base = { fullName: "Test customer", phone: "09120000001", isActive: true };
const nationalCode = "1234567891"; // Synthetic checksum-valid fixture, not a real user's identity.

test("legacy accounts remain readable and require identity completion, optional preferences are not required", async () => {
  const customer = new Customer({ ...base, addresses: [{ title: "Home", province: "Tehran", city: "Tehran", line: "Existing address" }] });
  await customer.validate();
  assert.deepEqual(completionStatus(customer, "customer").missingFields, ["کد ملی"]);
  customer.nationalCode = "۱۲۳۴۵۶۷۸۹۱";
  await customer.validate();
  assert.equal(customer.nationalCode, nationalCode);
  assert.equal(completionStatus(customer, "customer").complete, true);
  assert.equal(customer.addresses[0].line, "Existing address");
  assert.equal(customer.accessibility.wheelchair, false);
  assert.equal(validNationalCode("1111111111"), false);
  customer.nationalCode = "1234567890";
  await assert.rejects(customer.validate(), { name: "ValidationError" });
});

test("supplier legal profiles require an economic code, individual profiles require national code", async () => {
  const profile = new Supplier({ name: "Supplier", contacts: { mobile: base.phone }, personType: "legal", nationalCode });
  assert.deepEqual(completionStatus(profile, "supplier").missingFields, ["کد اقتصادی"]);
  profile.economicCode = "۱۲۳۴۵۶۷۸۹۰۱۲";
  await profile.validate();
  assert.equal(completionStatus(profile, "supplier").complete, true);
  profile.personType = "individual";
  profile.nationalCode = undefined;
  assert.deepEqual(completionStatus(profile, "supplier").missingFields, ["کد ملی"]);
  assert.throws(() => pickProfileFields({ personType: "legal" }, "customer"), { statusCode: 422 });
  assert.throws(() => pickProfileFields({ nationalCode: 1234567891 }, "customer"), { statusCode: 422 });
  assert.throws(() => pickProfileFields({ accessibility: { wheelchair: "false" } }, "supplier"), { statusCode: 422 });
  assert.deepEqual(pickProfileFields({ accessibility: { wheelchair: false, injected: true }, role: "admin", isActive: true, phone: "injected" }, "customer"), { accessibility: { wheelchair: false } });
});

test("order and RFQ paths reject incomplete profiles before attempting stock or order writes", async (t) => {
  const original = Customer.findById;
  t.after(() => { Customer.findById = original; });
  const id = String(new mongoose.Types.ObjectId());
  let profile = { ...base };
  Customer.findById = () => ({ lean: async () => profile });
  const orderService = require("../src/modules/orders/service/order.service");
  for (const items of [[{ partId: id, qty: 1 }], [{ bundleId: id, type: "bundle", qty: 1 }]]) {
    await assert.rejects(orderService.createOrder(id, items), { code: "PROFILE_INCOMPLETE", statusCode: 403 });
  }
  await assert.rejects(require("../src/modules/bundles/service/bundleOrder.service").createBundleOrder(id, []), { code: "PROFILE_INCOMPLETE" });
  profile.nationalCode = nationalCode;
  assert.equal((await requireCompleteProfile("customer", id)).nationalCode, nationalCode);
});

test("self profile API derives ownership from the token and ignores phone, role and activation injection", async (t) => {
  const jwt = require("jsonwebtoken");
  const router = require("../src/modules/accounts");
  const Auth = require("../src/modules/auth/model/auth.model");
  const originalAuthFind = Auth.findOne;
  t.after(() => { Auth.findOne = originalAuthFind; });
  Auth.findOne = () => ({ select: () => ({ lean: async () => ({ isActive: true, sessionVersion: 0 }) }) });
  const original = accounts.updateAccount;
  const secret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = "profile-completion-test-only";
  t.after(() => { accounts.updateAccount = original; if (secret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = secret; });
  const ownId = String(new mongoose.Types.ObjectId());
  const calls = [];
  accounts.updateAccount = async (kind, id, payload) => { calls.push({ kind, id, payload }); return { ...base, ...payload }; };
  const token = jwt.sign({ role: "customer", userId: ownId }, process.env.JWT_ACCESS_SECRET);
  const result = await new Promise((resolve, reject) => {
    router.handle({ method: "PATCH", url: "/me/profile", headers: { authorization: `Bearer ${token}` }, body: { userId: "another", phone: "09120000009", isActive: false, role: "admin", nationalCode, fullName: "Own name", accessibility: { hearingImpairment: true } } }, {
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve(body); },
    }, reject);
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, ownId);
  assert.equal(calls[0].kind, "customer");
  assert.equal(calls[0].payload.phone, undefined);
  assert.equal(calls[0].payload.role, undefined);
  assert.equal(calls[0].payload.isActive, undefined);
  assert.equal(result.completion.complete, true);
});
