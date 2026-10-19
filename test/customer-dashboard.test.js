const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Customer = require("../src/modules/customer/model/customer.model");
const CarModel = require("../src/modules/vehicles/model/carModel.model");
const service = require("../src/modules/customer/service/customer.service");
const { authorizeCustomerOwnership } = require("../src/modules/auth/middleware/auth.middleware");

test("saved entries persist without replacing another vehicle or address", async (t) => {
  const original = { findById: Customer.findById, updateOne: Customer.updateOne, exists: CarModel.exists };
  t.after(() => { Customer.findById = original.findById; Customer.updateOne = original.updateOne; CarModel.exists = original.exists; });
  const carId = new mongoose.Types.ObjectId();
  let customer = new Customer({ fullName: "Customer", phone: "09120000001", addresses: [
    { title: "خانه", province: "تهران", city: "تهران", line: "نشانی اول" },
    { title: "کار", province: "تهران", city: "تهران", line: "نشانی دوم" },
  ], carModels: [{ carModelId: carId, year: "1400", vin: "first" }, { carModelId: carId, year: "1402", vin: "second" }] });
  const customerId = String(customer._id);
  let writes = 0;
  Customer.findById = (id) => {
    const copy = id === customerId ? new Customer(customer.toObject()) : null;
    const query = Promise.resolve(copy);
    query.populate = () => query;
    return query;
  };
  CarModel.exists = async () => true;
  Customer.updateOne = async (filter, update) => {
    const collection = update.$set.addresses ? "addresses" : "carModels";
    assert.equal(String(filter._id), customerId);
    assert.deepEqual(filter[collection], customer[collection].map((entry) => entry.toObject()));
    customer.set(collection, update.$set[collection]);
    writes++;
    return { matchedCount: 1 };
  };
  const firstAddress = String(customer.addresses[0]._id);
  await service.changeCustomerEntry(customerId, "addresses", firstAddress, { title: "خانه جدید", province: "تهران", city: "تهران", line: "نشانی جدید" });
  assert.equal(customer.addresses[0].line, "نشانی جدید");
  assert.equal(customer.addresses[1].line, "نشانی دوم");
  const expected = { carModelId: String(carId), year: "1402", vin: "second" };
  await service.changeCustomerEntry(customerId, "carModels", "1", { carModelId: carId, year: "1403", vin: "second" }, expected);
  assert.equal(customer.carModels[0].year, "1400");
  assert.equal(customer.carModels[1].year, "1403");
  await assert.rejects(service.changeCustomerEntry(customerId, "carModels", "1", null, expected), { statusCode: 409 });
  await assert.rejects(service.changeCustomerEntry(customerId, "addresses", String(new mongoose.Types.ObjectId()), null), { statusCode: 404 });
  assert.equal(writes, 2);
  await service.changeCustomerEntry(customerId, "carModels", "1", null, { ...expected, year: "1403" });
  await service.changeCustomerEntry(customerId, "addresses", firstAddress, null);
  assert.equal(customer.carModels.length, 1);
  assert.equal(customer.carModels[0].vin, "first");
  assert.equal(customer.addresses.length, 1);
  assert.equal(customer.addresses[0].title, "کار");
  Customer.updateOne = async () => ({ matchedCount: 0 });
  await assert.rejects(service.changeCustomerEntry(customerId, "addresses", String(customer.addresses[0]._id), null), { statusCode: 409 });
});

test("all saved-entry routes reject access to another customer's records", async (t) => {
  const jwt = require("jsonwebtoken");
  const router = require("../src/modules/customer/routes/customer.routes");
  const Auth = require("../src/modules/auth/model/auth.model");
  const originalAuthFind = Auth.findOne;
  t.after(() => { Auth.findOne = originalAuthFind; });
  Auth.findOne = () => ({ select: () => ({ lean: async () => ({ isActive: true, sessionVersion: 0 }) }) });
  const secret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = "customer-dashboard-test-only";
  try {
    const token = jwt.sign({ userId: "own-id", role: "customer" }, process.env.JWT_ACCESS_SECRET);
    for (const method of ["PUT", "DELETE"]) {
      for (const collection of ["addresses", "car-models"]) {
        const result = await new Promise((resolve, reject) => {
          const req = { method, url: `/other-id/${collection}/0`, headers: { authorization: `Bearer ${token}` } };
          const res = { status(code) { this.statusCode = code; return this; }, json(body) { resolve({ status: this.statusCode, body }); } };
          router.handle(req, res, reject);
        });
        assert.equal(result.status, 403);
      }
    }
    let allowed = false;
    authorizeCustomerOwnership({ user: { role: "customer", userId: "own" }, params: { id: "own" } }, {}, () => { allowed = true; });
    assert.equal(allowed, true);
  } finally {
    if (secret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = secret;
  }
});
