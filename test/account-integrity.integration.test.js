const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Auth = require("../src/modules/auth/model/auth.model");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const Customer = require("../src/modules/customer/model/customer.model");
const Staff = require("../src/modules/staff/model/staff.model");
const service = require("../src/modules/accounts/service/account.service");
const supplierService = require("../src/modules/suppliers/service/supplier.service");
const { installAccountValidators } = require("../src/core/database/accountValidators");

test("account integrity and admin repair", { skip: !process.env.SALES_TEST_MONGO_URL }, async (t) => {
  await mongoose.connect(process.env.SALES_TEST_MONGO_URL, { dbName: `account_integrity_${crypto.randomBytes(8).toString("hex")}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Auth.init(), Customer.init(), Supplier.init(), Staff.init()]);
  let supplier, customer, staff;

  await t.test("rejects missing names, invalid mobile numbers and incomplete login references", async () => {
    for (const [kind, data] of [
      ["supplier", { name: "Supplier", contacts: { mobile: "" } }],
      ["supplier", { name: " ", contacts: { mobile: "09120000001" } }],
      ["customer", { fullName: "Customer", phone: "0912" }],
      ["staff", { fullName: "Staff", phone: "02112345678", role: "operator" }],
    ]) await assert.rejects(service.createAccount(kind, data), { name: "ValidationError" });
    for (const data of [
      { phone: "09120000001", role: "supplier" },
      { phone: "09120000001", role: "supplier", refModel: "Customer", refId: new mongoose.Types.ObjectId() },
    ]) await assert.rejects(new Auth(data).validate(), { name: "ValidationError" });
    assert.equal(await Auth.countDocuments(), 0);
    assert.equal(await Supplier.countDocuments(), 0);
  });

  await t.test("creates complete accounts for all roles and normalizes Persian digits", async () => {
    supplier = await service.createAccount("supplier", { name: "Supplier", nationalCode: "1234567891", contacts: { mobile: "۰۹۱۲۰۰۰۰۰۰۱" } });
    customer = await service.createAccount("customer", { fullName: "Customer", nationalCode: "1234567891", phone: "09120000002" });
    staff = await service.createAccount("staff", { fullName: "Staff", phone: "09120000003", role: "operator" });
    assert.equal(supplier.contacts.mobile, "09120000001");
    const rows = await service.listAccounts();
    assert.equal(rows.length, 3);
    assert.ok(rows.every((row) => row.integrity.complete));
    await assert.rejects(service.createAccount("customer", { fullName: "Duplicate", phone: supplier.contacts.mobile }), { statusCode: 409 });
    assert.equal(await Customer.countDocuments(), 1);
  });

  await t.test("invalid or conflicting updates cannot partially change profile or login", async () => {
    for (const payload of [ { phone: "" }, { fullName: " " }, { role: "supplier" } ]) {
      await assert.rejects(service.updateAccount("staff", staff._id, payload), { name: "ValidationError" });
    }
    await assert.rejects(service.updateAccount("staff", staff._id, { phone: customer.phone, fullName: "Changed" }), { statusCode: 409 });
    assert.equal((await Staff.findById(staff._id)).fullName, "Staff");
    assert.equal((await Auth.findOne({ refId: staff._id })).phone, staff.phone);
    await service.updateAccount("staff", staff._id, { phone: "09120000004" });
    assert.equal((await Auth.findOne({ refId: staff._id })).phone, "09120000004");
    await supplierService.updateSupplier(supplier._id, { isActive: false });
    assert.equal((await Auth.findOne({ refId: supplier._id })).isActive, false);
    await supplierService.updateSupplier(supplier._id, { isActive: true });
  });

  const legacyId = new mongoose.Types.ObjectId();
  await t.test("admin sees raw legacy defects and a safe recovery persists the missing phone", async () => {
    await Supplier.collection.insertOne({ _id: legacyId, name: "Legacy", contacts: {}, coverageRules: [], isActive: true });
    await Auth.collection.insertOne({ phone: "09120000005", role: "supplier", refId: legacyId, isActive: true });
    const before = (await service.listAccounts()).find((row) => String(row._id) === String(legacyId));
    assert.equal(before.integrity.complete, false);
    assert.equal(before.phone, undefined);
    assert.equal(before.loginPhone, "09120000005");
    await supplierService.updateMyProfile(legacyId, { name: "Legacy repaired", nationalCode: "1234567891" });
    assert.equal((await Supplier.collection.findOne({ _id: legacyId })).contacts.mobile, "09120000005");
    assert.equal((await Auth.findOne({ refId: legacyId })).refModel, "Supplier");
    assert.equal((await service.listAccounts()).find((row) => String(row._id) === String(legacyId)).integrity.complete, true);
  });

  const noLoginId = new mongoose.Types.ObjectId();
  await t.test("only admin repair can create a missing login, and no placeholder identity is invented", async () => {
    await Supplier.collection.insertOne({ _id: noLoginId, contacts: {}, coverageRules: [], isActive: true });
    await assert.rejects(supplierService.updateMyProfile(noLoginId, { address: "Address" }), { name: "ValidationError" });
    await assert.rejects(service.updateAccount("supplier", noLoginId, { name: "Real supplier", phone: "09120000006" }), { statusCode: 422 });
    assert.equal((await Supplier.findById(noLoginId)).name, undefined);
    await service.updateAccount("supplier", noLoginId, { name: "Real supplier", phone: "09120000006" }, { repair: true });
    const login = await Auth.findOne({ refId: noLoginId });
    assert.equal(login.refModel, "Supplier");
    assert.equal(login.phone, "09120000006");
  });

  await t.test("admin audit detects invalid roles and missing active flags in legacy data", async () => {
    const id = new mongoose.Types.ObjectId();
    await Staff.collection.insertOne({ _id: id, fullName: "Legacy staff", phone: "09120000010", role: "unknown" });
    const row = (await service.listAccounts()).find((item) => String(item._id) === String(id));
    assert.equal(row.integrity.complete, false);
    assert.ok(row.integrity.issues.some((issue) => issue.includes("نقش پرسنل")));
    assert.ok(row.integrity.issues.some((issue) => issue.includes("وضعیت فعال")));
    await service.updateAccount("staff", id, { role: "operator", isActive: true }, { repair: true });
    assert.equal((await service.listAccounts()).find((item) => String(item._id) === String(id)).integrity.complete, true);
  });

  await t.test("orphan login repair preserves its identity and never overwrites an existing profile", async () => {
    const refId = new mongoose.Types.ObjectId();
    const result = await Auth.collection.insertOne({ phone: "09120000007", role: "customer", refId, isActive: true });
    const orphan = (await service.listAccounts()).find((row) => String(row._id) === String(result.insertedId));
    assert.equal(orphan.accountKind, "orphan");
    await assert.rejects(service.repairOrphan(result.insertedId, { fullName: "Customer", phone: customer.phone }), { statusCode: 409 });
    assert.equal(await Customer.exists({ _id: refId }), null);
    const profile = await service.repairOrphan(result.insertedId, { fullName: "Real customer", phone: "09120000007" });
    assert.equal(String(profile._id), String(refId));
    const auth = await Auth.findById(result.insertedId);
    assert.equal(auth.refModel, "Customer");
    await service.assertAccountReady(auth);
    await assert.rejects(service.repairOrphan(auth._id, { fullName: "Replacement", phone: auth.phone }), { statusCode: 409 });
    assert.equal((await Customer.findById(refId)).fullName, "Real customer");
  });

  await t.test("inconsistent and dangling accounts cannot get or refresh tokens", async () => {
    const account = await Auth.findOne({ refId: customer._id });
    await service.assertAccountReady(account);
    await assert.rejects(service.assertAccountReady({ ...account.toObject(), refId: new mongoose.Types.ObjectId() }), { statusCode: 403 });
    await assert.rejects(service.assertAccountReady({ ...account.toObject(), phone: "09120000999" }), { statusCode: 403 });
  });

  await t.test("only admin may view identity issues or repair another user's account", async (t) => {
    const express = require("express"), jwt = require("jsonwebtoken");
    const { once } = require("node:events");
    const secret = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString("hex");
    t.after(() => { if (secret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = secret; });
    const app = express();
    app.use(express.json());
    app.use("/users", require("../src/modules/accounts"));
    app.use(require("../src/core/middlewares/errorHandler"));
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
    const origin = `http://127.0.0.1:${server.address().port}/users`;
    const request = async (role, path = "", body) => {
      const userId = role === "customer" ? customer._id : role === "supplier" ? supplier._id : staff._id;
      const current = await Auth.findOne({ refId: userId, role });
      return fetch(origin + path, { method: body ? "PATCH" : "GET", headers: { Authorization: `Bearer ${jwt.sign({ role, userId: String(userId), sessionVersion: current?.sessionVersion || 0 }, process.env.JWT_ACCESS_SECRET)}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    };
    assert.equal((await fetch(origin)).status, 401);
    for (const role of ["supplier", "customer", "operator"]) {
      assert.equal((await request(role)).status, 403);
      assert.equal((await request(role, `/supplier/${supplier._id}`, { fullName: "Injected", phone: "09120000008" })).status, 403);
    }
    assert.equal((await request("admin")).status, 200);
    assert.equal((await request("admin", `/supplier/${supplier._id}`, { fullName: "Admin verified name", phone: supplier.contacts.mobile })).status, 200);
    assert.equal((await Supplier.findById(supplier._id)).name, "Admin verified name");
    assert.equal((await request("admin", `/supplier/${supplier._id}`, { isActive: false })).status, 200);
    assert.equal((await Auth.findOne({ refId: supplier._id })).isActive, false);
  });

  await t.test("MongoDB itself blocks incomplete writes, preserves earlier constraints, and creation rolls back", async () => {
    const db = mongoose.connection.db;
    await db.command({ collMod: "auths", validator: { phone: { $ne: "09120000123" } } });
    await installAccountValidators(db);
    const before = (await db.listCollections({ name: "auths" }).toArray())[0].options.validator;
    await installAccountValidators(db);
    const after = (await db.listCollections({ name: "auths" }).toArray())[0].options.validator;
    assert.deepEqual(after, before);
    for (const [Model, invalid] of [
      [Supplier, { name: "Incomplete", contacts: {}, isActive: true }],
      [Customer, { fullName: " ", phone: "09120000998", isActive: true }],
      [Staff, { fullName: "Staff", phone: "bad", role: "operator", isActive: true }],
      [Auth, { phone: "09120000998", role: "supplier", isActive: true }],
      [Auth, { phone: "09120000998", role: "supplier", refModel: "Customer", refId: new mongoose.Types.ObjectId(), isActive: true }],
    ]) await assert.rejects(Model.collection.insertOne(invalid), { code: 121 });
    await assert.rejects(Supplier.collection.updateOne({ _id: legacyId }, { $unset: { "contacts.mobile": "" } }), { code: 121 });
    await assert.rejects(service.createAccount("supplier", { name: "Must roll back", contacts: { mobile: "09120000123" } }), { code: 121 });
    assert.equal(await Supplier.countDocuments({ name: "Must roll back" }), 0);
    await service.createAccount("customer", { fullName: "Valid after validation", phone: "09120000997" });
  });

  await t.test("constraints also initialize correctly on a new database", async (t) => {
    const fresh = mongoose.connection.useDb(`account_constraints_${crypto.randomBytes(8).toString("hex")}`);
    t.after(() => fresh.dropDatabase());
    await installAccountValidators(fresh.db);
    await installAccountValidators(fresh.db);
    assert.equal((await fresh.db.listCollections().toArray()).length, 4);
    await assert.rejects(fresh.db.collection("suppliers").insertOne({ name: "Missing mobile" }), { code: 121 });
  });
});
