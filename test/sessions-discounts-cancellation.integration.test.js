const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

test('device sessions, scoped discounts and cancellation permissions', { skip: !process.env.FEATURE_TEST_MONGO_URL || !process.env.FEATURE_TEST_REDIS_URL }, async t => {
  await mongoose.connect(process.env.FEATURE_TEST_MONGO_URL, { dbName: `features_${crypto.randomBytes(8).toString('hex')}` });
  const redis = new (require('ioredis'))(process.env.FEATURE_TEST_REDIS_URL);
  await redis.ping();
  const redisModule = require('../src/core/database/redis'), originalRedis = redisModule.getRedisClient;
  redisModule.getRedisClient = () => redis;
  const oldSecret = process.env.JWT_ACCESS_SECRET; process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString('hex');
  const accounts = require('../src/modules/accounts/service/account.service');
  const Auth = require('../src/modules/auth/model/auth.model');
  const auth = require('../src/modules/auth/service/auth.service');
  const sessions = require('../src/modules/auth/service/session.service');
  const Order = require('../src/modules/orders/model/order.model');
  const Invoice = require('../src/modules/invoice/model/invoice.model');
  const Discount = require('../src/modules/orders/model/discount.model');
  const Brand = require('../src/modules/vehicles/model/brand.model');
  const CarModel = require('../src/modules/vehicles/model/carModel.model');
  const Category = require('../src/modules/vehicles/model/partCategory.models');
  const Payment = require('../src/modules/payment/model/payment.model');
  const Bundle = require('../src/modules/bundles/model/bundle.model');
  const Invitation = require('../src/modules/invitation/model/invitation.model');
  t.after(async () => { redisModule.getRedisClient = originalRedis; if (oldSecret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = oldSecret; await redis.quit(); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Auth.init(), Discount.init(), Invoice.init()]);
  const customer = await accounts.createAccount('customer', { fullName: 'Customer', phone: '09120000001', nationalCode: '1234567891' });
  const other = await accounts.createAccount('customer', { fullName: 'Other', phone: '09120000002', nationalCode: '1234567891' });
  const supplier = await accounts.createAccount('supplier', { name: 'Supplier', contacts: { mobile: '09120000003' }, nationalCode: '1234567891' });
  const admin = await accounts.createAccount('staff', { fullName: 'Admin', phone: '09120000004', role: 'admin' });
  const operator = await accounts.createAccount('staff', { fullName: 'Operator', phone: '09120000005', role: 'operator' });
  async function login(phone, userAgent = 'Test Chrome/140.0 Linux') { await redis.set(`otp:${phone}`, '123456', 'EX', 120); return auth.verifyOtp(phone, '123456', { userAgent }); }
  const first = await login(customer.phone), second = await login(customer.phone, 'Android Chrome/140.0'), foreign = await login(other.phone), supplierSession = await login(supplier.contacts.mobile), adminSession = await login(admin.phone), operatorSession = await login(operator.phone);
  const express = require('express'), app = express(); app.use(express.json());
  app.use('/auth', require('../src/modules/auth/routes/auth.routes')); app.use('/users', require('../src/modules/accounts')); app.use('/discounts', require('../src/modules/discounts')); app.use('/orders', require('../src/modules/orders/routes/order.routes')); app.use(require('../src/core/middlewares/errorHandler'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const request = async (session, path, method = 'GET', body) => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  await t.test('all roles see only their devices, secrets stay private, revoke blocks access and refresh', async () => {
    const rows = await request(first, '/auth/sessions'); assert.equal(rows.status, 200); assert.equal(rows.body.data.length, 2); assert.equal(rows.body.data.filter(item => item.current).length, 1);
    assert(!JSON.stringify(rows.body).includes(first.refreshToken)); assert(!JSON.stringify(rows.body).includes('authId'));
    const foreignId = (await request(foreign, '/auth/sessions')).body.data[0].id;
    assert.equal((await request(first, `/auth/sessions/${foreignId}`, 'DELETE')).status, 404);
    const target = rows.body.data.find(item => !item.current);
    assert.equal((await request(first, `/auth/sessions/${target.id}`, 'DELETE')).status, 200);
    assert.equal((await request(second, '/users/me/profile')).status, 401);
    await assert.rejects(auth.refreshToken(second.refreshToken), { statusCode: 401 });
    assert.equal((await request(first, '/users/me/profile')).status, 200);
    for (const session of [adminSession, supplierSession]) { const own = await request(session, '/auth/sessions'); assert.equal(own.status, 200); assert.equal(own.body.data.length, 1); }
    const extra = await login(customer.phone);
    assert.equal((await request(first, '/auth/sessions', 'DELETE')).status, 200);
    assert.equal((await request(extra, '/users/me/profile')).status, 401);
  });
  await t.test('legacy refresh tokens are imported and old access tokens must refresh before continued use', async () => {
    const linked = await Auth.findOne({ refId: other._id });
    const token = crypto.randomBytes(64).toString('hex'); await redis.set(`refresh:${token}`, String(linked._id), 'EX', 300);
    // Allow this deliberately-created legacy fixture to be discovered on the first list.
    await redis.del(`sessionsImported:${linked._id}`);
    const rows = (await request(foreign, '/auth/sessions')).body.data;
    const legacy = rows.find(item => item.id === sessions.sessionId(token)); assert(legacy); assert.equal(legacy.createdAt, null);
    const legacyAccess = jwt.sign({ userId: String(other._id), role: 'customer', refModel: 'Customer' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    assert.equal((await request({ accessToken: legacyAccess }, '/users/me/profile')).status, 401);
    const refreshed = await auth.refreshToken(token, { userAgent: 'Firefox/130.0 Linux' }); assert(jwt.decode(refreshed.accessToken).sid);
    assert.equal((await request(foreign, `/auth/sessions/${legacy.id}`, 'DELETE')).status, 200);
    assert.equal((await request(refreshed, '/users/me/profile')).status, 401);
  });
  const brand = await Brand.create({ name: 'Brand', slug: 'brand' });
  const model = await CarModel.create({ name: 'Model', slug: 'model', brand: brand._id, yearRange: { from: '2020', to: '2026' } });
  const root = await Category.create({ name: 'Root', slug: 'root' }), leaf = await Category.create({ name: 'Leaf', slug: 'leaf', parentId: root._id }), unrelated = await Category.create({ name: 'Other', slug: 'other' });
  const makeOrder = async () => {
    const customerInfo = { customerId: customer._id, name: customer.fullName, phone: customer.phone };
    const order = await Order.create({ status: 'awaiting_payment', customer: customerInfo, items: [
      { partId: new mongoose.Types.ObjectId(), categoryId: leaf._id, carModelId: model._id, title: 'Eligible', qty: 2, unitPrice: 1000, availability: { status: 'available' }, selectedOffer: { selectedQuantity: 2, customerUnitPrice: 1000, baseUnitPrice: 900, supplierId: supplier._id } },
      { partId: new mongoose.Types.ObjectId(), categoryId: unrelated._id, title: 'Other', qty: 1, unitPrice: 8000, availability: { status: 'available' }, selectedOffer: { selectedQuantity: 1, customerUnitPrice: 8000 } },
    ] });
    const invoice = await Invoice.create({ orderId: order._id, customer: customerInfo, lines: [], total: 10000, subtotal: 10000 });
    order.invoiceId = invoice._id; await order.save(); return order;
  };
  let discount;
  await t.test('only admin can create discounts; invalid limits, dates, targets and duplicate codes fail', async () => {
    const body = { name: 'Campaign', code: ' sale_50 ', type: 'percent', value: 50, maximumDiscount: 800, minimumSubtotal: 5000, expiresAt: new Date(Date.now() + 86400000).toISOString(), applicableTo: 'parts', categoryIds: [String(root._id)], modelIds: [String(model._id)], brandIds: [String(brand._id)] };
    for (const role of [first, supplierSession, operatorSession]) assert.equal((await request(role, '/discounts', 'POST', body)).status, 403);
    const saved = await request(adminSession, '/discounts', 'POST', body); assert.equal(saved.status, 201); discount = saved.body.data; assert.equal(discount.code, 'SALE_50');
    assert.equal((await request(adminSession, '/discounts', 'POST', body)).status, 400);
    for (const patch of [{ value: 101 }, { maximumDiscount: -1 }, { expiresAt: 'wrong' }, { startsAt: new Date(Date.now() + 172800000).toISOString() }, { brandIds: [String(new mongoose.Types.ObjectId())] }, { applicableTo: 'bundles' }, { malicious: true }]) assert.equal((await request(adminSession, `/discounts/${discount._id}`, 'PUT', patch)).status, 400);
    assert.equal((await Discount.findById(discount._id)).value, 50);
  });
  const checkout = require('../src/modules/orders/service/checkout.service');
  const address = { title: 'Home', province: 'Tehran', city: 'Tehran', line: 'Saved address' };
  await t.test('eligible category descendants/model/brand are discounted, code case normalizes, rejected codes roll back', async () => {
    const order = await makeOrder();
    const result = await checkout.prepareCheckout(String(order._id), String(customer._id), { address, discountCode: 'sale_50' });
    assert.equal(result.order.checkout.subtotal, 10000); assert.equal(result.order.checkout.discountAmount, 800); assert.equal(result.order.checkout.total, 9200);
    assert.equal((await Invoice.findById(order.invoiceId)).total, 9200);
    await Discount.updateOne({ _id: discount._id }, { $set: { isActive: false } });
    await assert.rejects(checkout.prepareCheckout(String(order._id), String(customer._id), { address, discountCode: 'SALE_50' }), { statusCode: 400 });
    assert.equal((await Invoice.findById(order.invoiceId)).total, 9200);
    // A saved quote cannot use a now-disabled code to start a payment.
    await assert.rejects(require('../src/modules/payment/service/payment.service').createSessionForOrder(String(order._id), String(customer._id)), { statusCode: 400 });
    assert.equal(await Payment.countDocuments({ orderId: order._id }), 0);
    await Discount.updateOne({ _id: discount._id }, { $set: { isActive: true, expiresAt: new Date(Date.now() - 1000) } });
    await assert.rejects(checkout.prepareCheckout(String(order._id), String(customer._id), { address, discountCode: 'SALE_50' }), { statusCode: 400 });
  });
  await t.test('pack-only discounts apply to packs and reject quotation parts', async () => {
    const packDiscount = await Discount.create({ code: 'PACK', type: 'fixed', value: 250, applicableTo: 'bundles', expiresAt: new Date(Date.now() + 86400000) });
    const bundle = await Bundle.create({ name: 'Pack', contents: [{ title: 'Oil', qty: 1 }], price: 1000, stock: 3, isActive: true });
    const packOrder = await require('../src/modules/bundles/service/bundleOrder.service').createBundleOrder(String(customer._id), [{ bundleId: String(bundle._id), qty: 1 }]);
    const result = await checkout.prepareCheckout(String(packOrder._id), String(customer._id), { address, discountCode: packDiscount.code });
    assert.equal(result.order.checkout.total, 750);
    const parts = await makeOrder(); await assert.rejects(checkout.prepareCheckout(String(parts._id), String(customer._id), { address, discountCode: 'PACK' }), { statusCode: 400 });
    assert.equal((await request(first, `/orders/${packOrder._id}/cancel`, 'POST', { confirm: true, reason: 'No longer needed' })).status, 200);
    assert.equal((await Bundle.findById(bundle._id)).stock, 3);
  });
  await t.test('cancellation requires a reason/confirmation, enforces owner/role, cancels invoice and expires supplier invitations', async () => {
    const order = await makeOrder();
    await Invitation.create({ orderId: order._id, supplierId: supplier._id, items: [{ itemKey: "test-item", partId: order.items[0].partId, categoryId: leaf._id, title: "Eligible", requestedQuantity: 2 }], token: { hash: crypto.randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 86400000) } });
    const path = `/orders/${order._id}/cancel`, body = { confirm: true, reason: 'Customer changed their mind' };
    assert.equal((await request(first, path, 'POST', { reason: 'x' })).status, 400);
    assert.equal((await request(foreign, path, 'POST', body)).status, 404);
    assert.equal((await request(supplierSession, path, 'POST', body)).status, 403);
    assert.equal((await Order.findById(order._id)).status, 'awaiting_payment');
    const done = await request(first, path, 'POST', body); assert.equal(done.status, 200); assert.equal(done.body.data.status, 'cancelled');
    assert.equal(done.body.data.items[0].selectedOffer.baseUnitPrice, undefined);
    assert.equal((await Order.findById(order._id)).cancellation.reason, body.reason);
    assert.equal((await Invoice.findById(order.invoiceId)).status, 'cancelled');
    assert.equal((await Invitation.findOne({ orderId: order._id })).lifecycle.status, 'expired');
    assert.equal((await request(first, path, 'POST', body)).status, 409);
    for (const actor of [adminSession, operatorSession]) { const another = await makeOrder(); assert.equal((await request(actor, `/orders/${another._id}/cancel`, 'POST', body)).status, 200); }
    const paid = await makeOrder(); await Order.updateOne({ _id: paid._id }, { $set: { status: 'paid' } }); assert.equal((await request(adminSession, `/orders/${paid._id}/cancel`, 'POST', body)).status, 409);
    const active = await makeOrder(); await Payment.create({ orderId: active._id, customerId: customer._id, amount: 10000, status: 'pending' }); assert.equal((await request(first, `/orders/${active._id}/cancel`, 'POST', body)).status, 409);
  });
  await t.test('logout invalidates the current device session including its access token', async () => {
    await auth.logout(first.refreshToken);
    assert.equal((await request(first, '/users/me/profile')).status, 401);
  });
});
