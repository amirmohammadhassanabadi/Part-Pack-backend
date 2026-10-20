const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Customer = require('../src/modules/customer/model/customer.model');
const Supplier = require('../src/modules/suppliers/model/supplier.model');
const Auth = require('../src/modules/auth/model/auth.model');
const service = require('../src/modules/accounts/service/account.service');
const bank = require('../src/modules/accounts/service/bank-details');

// Synthetic BBAN; compute its IBAN check digits independently using BigInt.
const bban = '0540000000000000000001';
const iban = `IR${String(98n - BigInt(`${bban}182700`) % 97n).padStart(2, '0')}${bban}`;
const card = '6037990000000006';
test('bank fields normalize digits, reject invalid check digits and whitelist stored fields', async () => {
  assert(bank.validIban(iban)); assert(bank.validCard(card));
  assert(!bank.validCard('0000000000000000')); assert(!bank.validCard('6037990000000007'));
  assert(!bank.validIban(iban.slice(0, -1) + '2'));
  const result = bank.pickBankDetails({ cardNumber: '۶۰۳۷-۹۹۰۰-۰۰۰۰-۰۰۰۶', iban: iban.toLowerCase(), accountHolder: ' Test ', cvv: '123' });
  assert.deepEqual(result, { cardNumber: card, iban, accountHolder: 'Test' });
  assert.throws(() => bank.pickBankDetails({ cardNumber: 123 }), /متنی/);
  const invalid = new Customer({ fullName: 'Test', phone: '09120000001', bankDetails: { cardNumber: '1234', iban: 'IR123' } });
  await assert.rejects(invalid.validate(), /bankDetails/);
});

test('self closure preserves records and bank data, revokes sessions, and cannot target another user', { skip: !process.env.PROFILE_TEST_MONGO_URL || !process.env.FEATURE_TEST_REDIS_URL }, async (t) => {
  await mongoose.connect(process.env.PROFILE_TEST_MONGO_URL, { dbName: `account_closure_${crypto.randomBytes(8).toString('hex')}` });
  const secret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString('hex');
  const redisModule = require('../src/core/database/redis');
  const originalRedis = redisModule.getRedisClient;
  const redis = new (require("ioredis"))(process.env.FEATURE_TEST_REDIS_URL);
  redisModule.getRedisClient = () => redis;
  t.after(() => redis.quit());
  const authService = require('../src/modules/auth/service/auth.service');
  t.after(async () => { redisModule.getRedisClient = originalRedis; if (secret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = secret; await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Customer.init(), Supplier.init(), Auth.init()]);
  const customer = await service.createAccount('customer', { fullName: 'Customer', phone: '09120000001', bankDetails: { accountHolder: 'Test', cardNumber: card, iban }, addresses: [{ title: 'Home', province: 'Tehran', city: 'Tehran', line: 'Saved address' }] });
  const supplier = await service.createAccount('supplier', { name: 'Supplier', contacts: { mobile: '09120000002' } });
  const express = require('express');
  const app = express(); app.use(express.json()); app.use('/users', require('../src/modules/accounts')); app.use(require('../src/core/middlewares/errorHandler'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const token = (role, id, version = 0) => jwt.sign({ role, userId: String(id), sessionVersion: version }, process.env.JWT_ACCESS_SECRET);
  const request = async (access, path = '/users/me/profile', method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  const orderId = new mongoose.Types.ObjectId(), invoiceId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection('orders').insertOne({ _id: orderId, customerId: customer._id, status: 'pending' });
  await mongoose.connection.collection('invoices').insertOne({ _id: invoiceId, customerId: customer._id, total: 100 });
  await Customer.updateOne({ _id: customer._id }, { $push: { orders: orderId, invoices: invoiceId } });
  const updateMany = Auth.updateMany;
  try {
    Auth.updateMany = async () => { throw new Error('Simulated auth write failure'); };
    await assert.rejects(service.deactivateOwnAccount('customer', customer._id), /Simulated/);
    assert.equal((await Customer.findById(customer._id)).isActive, true, 'profile must roll back when login deactivation fails');
  } finally { Auth.updateMany = updateMany; }
  const old = token('customer', customer._id);
  const auth = await Auth.findOne({ refId: customer._id });
  const legacyToken = crypto.randomBytes(32).toString('hex');
  await redis.set(`refresh:${legacyToken}`, String(auth._id), 'EX', 3600); // A legacy refresh without a version is also revoked.
  assert((await authService.refreshToken(legacyToken)).accessToken);
  assert.equal((await request(old, '/users/me', 'DELETE', {})).status, 400);
  assert.equal((await Customer.findById(customer._id)).isActive, true);
  const update = await request(old, '/users/me/profile', 'PATCH', { bankDetails: { accountHolder: 'Changed' } });
  assert.equal(update.status, 200);
  assert.equal(update.body.profile.bankDetails.cardNumber, card);
  const invalid = await request(old, '/users/me/profile', 'PATCH', { bankDetails: { cardNumber: '1234' } });
  assert.equal(invalid.status, 400);
  assert.equal((await Customer.findById(customer._id)).bankDetails.cardNumber, card);
  // An incomplete identity is allowed to close its own account; injected IDs are ignored.
  assert.equal((await request(old, '/users/me', 'DELETE', { confirm: true, userId: String(supplier._id), role: 'supplier' })).status, 200);
  const saved = await Customer.findById(customer._id);
  assert.equal(saved.isActive, false); assert(saved.deactivatedAt);
  assert.equal(String(saved.orders[0]), String(orderId)); assert.equal(String(saved.invoices[0]), String(invoiceId));
  assert.equal((await mongoose.connection.collection('orders').findOne({ _id: orderId })).status, 'pending');
  assert.equal((await mongoose.connection.collection('invoices').findOne({ _id: invoiceId })).total, 100);
  assert.equal(saved.addresses[0].line, 'Saved address'); assert.equal(saved.bankDetails.iban, iban);
  assert.equal((await Supplier.findById(supplier._id)).isActive, true);
  assert.equal((await Auth.findById(auth._id)).isActive, false);
  assert.equal((await request(old)).status, 401);
  await assert.rejects(authService.refreshToken(legacyToken), { statusCode: 401 });
  await redis.set(`otp:${customer.phone}`, '123456');
  await assert.rejects(authService.verifyOtp(customer.phone, '123456'), { statusCode: 403 });
  await service.updateAccount('customer', customer._id, { isActive: true });
  assert.equal((await request(old)).status, 401);
  await assert.rejects(authService.refreshToken(legacyToken), { statusCode: 401 });
  const version = (await Auth.findById(auth._id)).sessionVersion;
  assert.equal((await request(token('customer', customer._id, version))).status, 200);
  const supplierToken = token('supplier', supplier._id);
  assert.equal((await request(supplierToken, '/users/me/profile', 'PATCH', { bankDetails: { cardNumber: card, iban } })).status, 200);
  assert.equal((await request(supplierToken, '/users/me', 'DELETE', { confirm: true })).status, 200);
  assert.equal((await request(supplierToken)).status, 401);
  assert.equal((await Supplier.findById(supplier._id)).bankDetails.cardNumber, card);
  const adminProfile = await service.createAccount('staff', { fullName: 'Admin', phone: '09120000888', role: 'admin' });
  const admin = token('admin', adminProfile._id);
  const rows = await request(admin, '/users');
  assert.equal(rows.status, 200); assert.equal(rows.body.length, 3);
});
