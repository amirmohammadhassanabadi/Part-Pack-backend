const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Bundle = require("../src/modules/bundles/model/bundle.model");
const Order = require("../src/modules/orders/model/order.model");
const Invoice = require("../src/modules/invoice/model/invoice.model");
const Payment = require("../src/modules/payment/model/payment.model");
const Customer = require("../src/modules/customer/model/customer.model");
const Invitation = require("../src/modules/invitation/model/invitation.model");
const Discount = require("../src/modules/orders/model/discount.model");
const bundleService = require("../src/modules/bundles/service/bundle.service");
const { expireBundleOrders } = require("../src/modules/bundles/service/bundleOrder.service");
const orderService = require("../src/modules/orders/service/order.service");
const invoiceService = require("../src/modules/invoice/service/invoice.service");
const { prepareCheckout } = require("../src/modules/orders/service/checkout.service");
const paymentService = require("../src/modules/payment/service/payment.service");

const payload = (overrides = {}) => ({ name: "پک روغن و فیلتر", contents: [{ title: "روغن ۴ لیتری", qty: 1 }, { title: "فیلتر روغن", qty: 1 }], price: 5000000, originalPrice: 6000000, stock: 10, isActive: true, isFeatured: true, ...overrides });
const editPayload = (bundle, overrides = {}) => ({
  name: bundle.name, description: bundle.description, images: bundle.images, contents: bundle.contents.map((item) => ({ title: item.title, qty: item.qty, partId: item.partId ? String(item.partId) : null })),
  price: bundle.price, originalPrice: bundle.originalPrice, stock: bundle.stock,
  compatibilityNote: bundle.compatibilityNote, compatibleModelIds: bundle.compatibleModelIds.map(String),
  isActive: bundle.isActive, isFeatured: bundle.isFeatured, sortOrder: bundle.sortOrder, revision: bundle.revision, ...overrides,
});

test("bundle input rejects invalid money, quantities, stock and unknown fields", async () => {
  for (const patch of [{ price: 0 }, { price: 1.5 }, { stock: -1 }, { originalPrice: 1 }, { contents: [] }, { contents: [{ title: "Oil", qty: 0 }] }, { images: ["javascript:alert(1)"] }, { isActive: "true" }, { injected: true }]) {
    await assert.rejects(bundleService.validateBundle(payload(patch)), { statusCode: 400 });
  }
});

// Each run creates and drops only its own random database, never the application's database.
test("bundle commerce on an isolated replica set", { skip: !process.env.BUNDLE_TEST_MONGO_URL }, async (t) => {
  await mongoose.connect(process.env.BUNDLE_TEST_MONGO_URL, { dbName: `bundle_test_${crypto.randomBytes(8).toString("hex")}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Bundle.init(), Order.init(), Invoice.init(), Payment.init(), Invitation.init()]);
  const customer = await Customer.create({ fullName: "Bundle customer", phone: "09120000000" });
  const other = await Customer.create({ fullName: "Other customer", phone: "09120000001" });
  const customerId = String(customer._id);
  const create = (bundle, qty = 1, extra = {}) => orderService.createOrder(customerId, [{ type: "bundle", bundleId: String(bundle._id), qty, ...extra }]);
  const address = { title: "Home", province: "Tehran", city: "Tehran", line: "Test address" };
  const makeDue = (order) => Order.updateOne({ _id: order._id }, { $set: { "bundleReservation.expiresAt": new Date(0) } });

  await t.test("admin-only CRUD, public visibility and ownership are enforced by HTTP", async () => {
    process.env.JWT_ACCESS_SECRET = "isolated-bundle-test-secret";
    const app = require("../src/app");
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    try {
      const base = `http://127.0.0.1:${server.address().port}/api/v1`;
      const request = async (path, role, options = {}) => {
        const response = await fetch(`${base}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${jwt.sign({ role, userId: role === "customer" ? customerId : String(new mongoose.Types.ObjectId()) }, process.env.JWT_ACCESS_SECRET)}` } : {}) } });
        return { status: response.status, body: await response.json() };
      };
      assert.equal((await request("/bundles/admin")).status, 401);
      for (const role of ["supplier", "operator", "customer"]) {
        assert.equal((await request("/bundles", role, { method: "POST", body: JSON.stringify(payload()) })).status, 403);
        assert.equal((await request("/bundles/admin", role)).status, 403);
      }
      const created = await request("/bundles", "admin", { method: "POST", body: JSON.stringify(payload({ isActive: false })) });
      assert.equal(created.status, 201);
      const id = created.body.data._id;
      assert.equal((await request(`/bundles/${id}`)).status, 404);
      assert.ok(!(await request("/bundles?featured=true")).body.data.some((item) => item._id === id));
      assert.ok((await request("/bundles/admin", "admin")).body.data.some((item) => item._id === id));
      const activated = await request(`/bundles/${id}`, "admin", { method: "PUT", body: JSON.stringify(editPayload(created.body.data, { isActive: true })) });
      assert.equal(activated.status, 200);
      assert.equal((await request(`/bundles/${id}`)).status, 200);
      assert.equal((await request(`/bundles/${id}`, "admin", { method: "DELETE" })).status, 200);
      assert.equal(await Bundle.countDocuments({ _id: id }), 1);
      const ownBundle = await bundleService.createBundle(payload());
      const orderResponse = await request("/orders", "customer", { method: "POST", body: JSON.stringify({ items: [{ type: "bundle", bundleId: String(ownBundle._id), qty: 1 }] }) });
      assert.equal(orderResponse.status, 201);
      const order = orderResponse.body.data;
      assert.equal(order.status, "awaiting_payment");
      const token = jwt.sign({ role: "customer", userId: String(other._id) }, process.env.JWT_ACCESS_SECRET);
      const response = await fetch(`${base}/orders/my-orders/${order._id}`, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 404);
    } finally { await new Promise((resolve) => server.close(resolve)); }
  });

  await t.test("server pricing, snapshots and old records are preserved", async () => {
    const bundle = await bundleService.createBundle(payload());
    const order = await create(bundle, 2, { price: 1, unitPrice: 1 });
    assert.equal(order.kind, "bundle");
    assert.equal(order.status, "awaiting_payment");
    assert.equal(order.items[0].unitPrice, 5000000);
    assert.equal((await Bundle.findById(bundle._id)).stock, 8);
    assert.equal(await Invitation.countDocuments({ orderId: order._id }), 0);
    const invoice = await Invoice.findById(order.invoiceId);
    assert.equal(invoice.total, 10000000);
    assert.equal(invoice.lines[0].type, "bundle");
    const fresh = await Bundle.findById(bundle._id);
    await bundleService.updateBundle(String(bundle._id), editPayload(fresh, { name: "Changed pack", price: 5500000 }));
    assert.equal((await Order.findById(order._id)).items[0].bundleSnapshot.name, bundle.name);
    assert.equal((await Invoice.findById(order.invoiceId)).lines[0].unitPrice, 5000000);
    const legacyId = new mongoose.Types.ObjectId();
    await Order.collection.insertOne({ _id: legacyId, status: "pending", customer: { customerId: customer._id, name: customer.fullName, phone: customer.phone }, items: [{ partId: new mongoose.Types.ObjectId(), categoryId: new mongoose.Types.ObjectId(), title: "Existing part", qty: 1 }] });
    const legacy = await Order.findById(legacyId);
    assert.equal(legacy.kind, "quotation");
    assert.equal(legacy.items[0].type, "part");
    assert.equal(legacy.items[0].title, "Existing part");
    assert.equal((await Order.collection.findOne({ _id: legacyId })).kind, undefined);
  });

  await t.test("last stock cannot be oversold and stale admin edits cannot overwrite reservations", async () => {
    const bundle = await bundleService.createBundle(payload({ stock: 1 }));
    const results = await Promise.allSettled([create(bundle), create(bundle)]);
    assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal((await Bundle.findById(bundle._id)).stock, 0);
    await assert.rejects(bundleService.updateBundle(String(bundle._id), editPayload(bundle, { stock: 50 })), { statusCode: 409 });
    assert.equal(await Order.countDocuments({ "items.bundleId": bundle._id }), 1);
  });

  await t.test("multi-pack failure rolls back stock, orders and invoices", async () => {
    const a = await bundleService.createBundle(payload({ stock: 2 }));
    const b = await bundleService.createBundle(payload({ stock: 0 }));
    const count = await Order.countDocuments();
    await assert.rejects(orderService.createOrder(customerId, [{ bundleId: String(a._id), qty: 1 }, { bundleId: String(b._id), qty: 1 }]), { statusCode: 409 });
    assert.equal((await Bundle.findById(a._id)).stock, 2);
    assert.equal(await Order.countDocuments(), count);
    await assert.rejects(orderService.createOrder(customerId, [{ bundleId: String(a._id), qty: 1 }, { partId: String(new mongoose.Types.ObjectId()), qty: 1 }]), { statusCode: 400 });
  });

  await t.test("checkout uses snapshot amounts and forbids another customer", async () => {
    const bundle = await bundleService.createBundle(payload());
    const order = await create(bundle, 2);
    await assert.rejects(prepareCheckout(String(order._id), String(other._id), { address }), { statusCode: 404 });
    const checkout = await prepareCheckout(String(order._id), customerId, { address, total: 1 });
    assert.equal(checkout.payment.amount, 10000000);
    assert.equal(checkout.order.shippingAddress.city, "Tehran");
    await assert.rejects(paymentService.createSessionForOrder(String(order._id), customerId), { code: "PAYMENT_PROVIDER_NOT_CONFIGURED" });
    assert.equal((await Payment.findOne({ orderId: order._id })).status, "not_configured");
  });

  await t.test("cancellation and expiry release stock exactly once, pending payments retain stock", async () => {
    const bundle = await bundleService.createBundle(payload({ stock: 4 }));
    const cancelled = await create(bundle);
    await invoiceService.cancelInvoice(String(cancelled.invoiceId));
    assert.equal((await Order.findById(cancelled._id)).status, "cancelled");
    assert.equal((await Bundle.findById(bundle._id)).stock, 4);
    await assert.rejects(orderService.cancelOrder(String(cancelled._id)));
    assert.equal((await Bundle.findById(bundle._id)).stock, 4);
    const expired = await create(bundle);
    await makeDue(expired);
    await expireBundleOrders(); await expireBundleOrders();
    assert.equal((await Order.findById(expired._id)).status, "expired");
    assert.equal((await Bundle.findById(bundle._id)).stock, 4);
    await assert.rejects(prepareCheckout(String(expired._id), customerId, { address }));
    const pending = await create(bundle);
    await makeDue(pending);
    await Payment.create({ orderId: pending._id, customerId, amount: 5000000, status: "pending" });
    await expireBundleOrders();
    assert.equal((await Order.findById(pending._id)).status, "awaiting_payment");
    assert.equal((await Bundle.findById(bundle._id)).stock, 3);
    await assert.rejects(orderService.cancelOrder(String(pending._id)), { statusCode: 409 });
    await Payment.updateOne({ orderId: pending._id }, { $set: { status: "failed" } });
    await expireBundleOrders();
    assert.equal((await Bundle.findById(bundle._id)).stock, 4);
  });

  await t.test("paid pack stock is never returned by the expiry job", async () => {
    const bundle = await bundleService.createBundle(payload({ stock: 2 }));
    const order = await create(bundle);
    await invoiceService.markInvoiceAsPaid(String(order.invoiceId));
    await makeDue(order);
    await expireBundleOrders();
    assert.equal((await Order.findById(order._id)).status, "paid");
    assert.equal((await Bundle.findById(bundle._id)).stock, 1);
    await assert.rejects(orderService.cancelOrder(String(order._id)), { statusCode: 409 });
  });

  await t.test("zero-total checkout settles the same invoice and never releases purchased packs", async () => {
    const bundle = await bundleService.createBundle(payload({ stock: 2 }));
    const order = await create(bundle);
    await Discount.create({ code: "BUNDLEFREE", type: "percent", value: 100 });
    const checkout = await prepareCheckout(String(order._id), customerId, { address, discountCode: "BUNDLEFREE" });
    assert.equal(checkout.order.status, "paid");
    assert.equal((await Invoice.findById(order.invoiceId)).status, "paid");
    assert.equal((await Payment.findOne({ orderId: order._id })).amount, 0);
    await makeDue(order); await expireBundleOrders();
    assert.equal((await Bundle.findById(bundle._id)).stock, 1);
  });

  await t.test("expired reservations cannot start payment; an existing pending session is reused", async () => {
    const bundle = await bundleService.createBundle(payload());
    const order = await create(bundle);
    await prepareCheckout(String(order._id), customerId, { address });
    await makeDue(order);
    await assert.rejects(paymentService.createSessionForOrder(String(order._id), customerId), { statusCode: 409 });
    assert.equal(await Payment.countDocuments({ orderId: order._id }), 0);
    const pending = await create(bundle);
    await prepareCheckout(String(pending._id), customerId, { address });
    const payment = await Payment.create({ orderId: pending._id, customerId, amount: 5000000, status: "pending", redirectUrl: "https://example.test/payment" });
    await makeDue(pending);
    const reused = await paymentService.createSessionForOrder(String(pending._id), customerId);
    assert.equal(String(reused._id), String(payment._id));
    assert.equal(await Payment.countDocuments({ orderId: pending._id }), 1);
  });
});
