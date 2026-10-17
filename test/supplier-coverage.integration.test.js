const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const Auth = require("../src/modules/auth/model/auth.model");
const Brand = require("../src/modules/vehicles/model/brand.model");
const CarModel = require("../src/modules/vehicles/model/carModel.model");
const Category = require("../src/modules/vehicles/model/partCategory.models");
const service = require("../src/modules/suppliers/service/supplier.service");

// Each run owns its temporary database; existing application records are untouched.
test("supplier self-service coverage with legacy profile fields", { skip: !process.env.SALES_TEST_MONGO_URL }, async (t) => {
  await mongoose.connect(process.env.SALES_TEST_MONGO_URL, { dbName: `supplier_coverage_test_${crypto.randomBytes(8).toString("hex")}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  const brand = await Brand.create({ name: "Brand", slug: "brand" });
  const model = await CarModel.create({ name: "Car", slug: "car", brand: brand._id, yearRange: { from: "2020", to: "2026" } });
  const categories = await Category.create([{ name: "Engine", slug: "engine" }, { name: "Brakes", slug: "brakes" }]);
  const payload = { vehicleBrandId: String(brand._id), carModelIds: [String(model._id)], partCategoryIds: [String(categories[0]._id)] };
  const id = new mongoose.Types.ObjectId();
  // Raw legacy data can lack required contact fields and contain incomplete inactive rules.
  const oldRuleId = new mongoose.Types.ObjectId();
  await Supplier.collection.insertOne({ _id: id, name: "Supplier", contacts: {}, coverageRules: [{ _id: oldRuleId, isActive: false }], isActive: true });

  await t.test("persists a missing legacy mobile before adding, editing and removing rules", async () => {
    await assert.rejects(service.addCoverage(String(id), payload), { name: "ValidationError" });
    assert.equal((await Supplier.collection.findOne({ _id: id })).coverageRules.length, 1);
    await Auth.collection.insertOne({ phone: "09120000009", role: "supplier", refId: id, isActive: true });
    const added = await service.addCoverage(String(id), payload);
    const active = added.coverageRules.filter((rule) => rule.isActive);
    assert.equal(active.length, 1);
    assert.equal(active[0].carModelIds[0].name, "Car");
    const ruleId = String(active[0]._id);
    const edited = await service.replaceCoverage(String(id), ruleId, { ...payload, partCategoryIds: [String(categories[1]._id)] });
    assert.equal(edited.coverageRules.find((rule) => String(rule._id) === ruleId).partCategoryIds[0].name, "Brakes");
    await service.removeCoverage(String(id), ruleId);
    const saved = await Supplier.collection.findOne({ _id: id });
    assert.equal(saved.coverageRules.find((rule) => String(rule._id) === ruleId).isActive, false);
    assert.equal(saved.coverageRules.find((rule) => String(rule._id) === String(oldRuleId)).isActive, false);
    assert.equal(saved.contacts.mobile, "09120000009");
    assert.equal((await Auth.findOne({ refId: id })).refModel, "Supplier");
    const readded = await service.addCoverage(String(id), payload);
    assert.equal(readded.coverageRules.filter((rule) => rule.isActive).length, 1);
  });

  await t.test("profile updates validate edited fields without revalidating legacy coverage", async () => {
    const updated = await service.updateMyProfile(String(id), { name: "New supplier name", address: "New address", contacts: { mobile: "injected" }, isActive: false });
    assert.equal(updated.name, "New supplier name");
    assert.equal(updated.address, "New address");
    assert.equal(updated.isActive, true);
    const raw = await Supplier.collection.findOne({ _id: id });
    assert.equal(raw.contacts.mobile, "09120000009");
    await assert.rejects(service.updateMyProfile(String(id), { name: " " }), { name: "ValidationError" });
  });

  await t.test("duplicate, invalid and foreign rules are rejected", async () => {
    await assert.rejects(service.addCoverage(String(id), payload), { statusCode: 409 });
    const foreignId = new mongoose.Types.ObjectId();
    await Supplier.create({ _id: foreignId, name: "Other supplier", contacts: { mobile: "09120000008" } });
    await Auth.create({ phone: "09120000008", role: "supplier", refModel: "Supplier", refId: foreignId });
    const own = await service.getSupplierById(String(id));
    const ownRule = own.coverageRules.find((rule) => rule.isActive);
    await assert.rejects(service.replaceCoverage(String(foreignId), String(ownRule._id), payload), { statusCode: 404 });
    await assert.rejects(service.removeCoverage(String(foreignId), String(ownRule._id)), { statusCode: 404 });
    await assert.rejects(service.addCoverage(String(id), { ...payload, carModelIds: [] }), { statusCode: 400 });
    for (const carModelIds of [null, "bad", ["invalid-id"]]) {
      await assert.rejects(service.addCoverage(String(id), { ...payload, carModelIds }), { statusCode: 400 });
    }
  });
  await t.test("authenticated supplier API supports coverage CRUD with a legacy login account", async (t) => {
    const express = require("express");
    const jwt = require("jsonwebtoken");
    const { once } = require("node:events");
    const previousSecret = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString("hex");
    t.after(() => {
      if (previousSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
      else process.env.JWT_ACCESS_SECRET = previousSecret;
    });
    // Simulate a legacy account; self-service persists its missing refModel/mobile.
    await Auth.collection.updateOne({ refId: id }, { $unset: { refModel: "" } });
    await Supplier.collection.updateOne({ _id: id }, { $unset: { "contacts.mobile": "" } });
    const app = express();
    app.use(express.json());
    app.use("/suppliers", require("../src/modules/suppliers/routes/supplier.routes"));
    app.use(require("../src/core/middlewares/errorHandler"));
    const server = app.listen(0, "127.0.0.1");
    t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
    await once(server, "listening");
    const origin = `http://127.0.0.1:${server.address().port}`;
    const token = jwt.sign({ userId: String(id), role: "supplier" }, process.env.JWT_ACCESS_SECRET);
    const request = async (path, method = "GET", body) => {
      const response = await fetch(`${origin}/suppliers${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, body: await response.json() };
    };
    const profile = await request("/me/profile");
    assert.equal(profile.status, 200);
    assert.equal(profile.body.contacts?.mobile, undefined);
    const added = await request("/me/coverage", "POST", { ...payload, supplierId: String(new mongoose.Types.ObjectId()), partCategoryIds: [String(categories[1]._id)] });
    assert.equal(added.status, 200);
    assert.equal(added.body.contacts.mobile, "09120000009");
    assert.equal((await Supplier.findById(id)).contacts.mobile, "09120000009");
    assert.equal(added.body._id, String(id));
    const addedRule = added.body.coverageRules.find((rule) => rule.isActive && rule.partCategoryIds[0]?._id === String(categories[1]._id));
    assert.ok(addedRule);
    const edited = await request(`/me/coverage/${addedRule._id}`, "PUT", { ...payload, partCategoryIds: categories.map((category) => String(category._id)) });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.coverageRules.find((rule) => rule._id === addedRule._id).partCategoryIds.length, 2);
    const removed = await request(`/me/coverage/${addedRule._id}`, "DELETE");
    assert.equal(removed.status, 200);
    assert.equal(removed.body.coverageRules.find((rule) => rule._id === addedRule._id).isActive, false);
    assert.equal((await request(`/${id}/coverage`)).status, 403);
  });

});
