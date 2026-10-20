const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');

test('staff scopes, token erasure and admin-controlled standard OTP flow', { skip: !process.env.FEATURE_TEST_MONGO_URL || !process.env.FEATURE_TEST_REDIS_URL }, async t => {
  await mongoose.connect(process.env.FEATURE_TEST_MONGO_URL, { dbName: `access_otp_${crypto.randomBytes(8).toString('hex')}` });
  const redis = new (require('ioredis'))(process.env.FEATURE_TEST_REDIS_URL);
  const redisModule = require('../src/core/database/redis'), oldRedis = redisModule.getRedisClient;
  redisModule.getRedisClient = () => redis;
  const oldSecret = process.env.JWT_ACCESS_SECRET; process.env.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString('hex');
  const sms = require('../src/integrations/kavenegar/kavenegarService'), originalSms = sms.sendOtp;
  const phonePrefix = '0912' + crypto.randomInt(10000, 100000);
  const phone = n => phonePrefix + String(n).padStart(2, '0');
  const sent = []; sms.sendOtp = async (...args) => sent.push(args);
  const accounts = require('../src/modules/accounts/service/account.service');
  const auth = require('../src/modules/auth/service/auth.service');
  const Auth = require('../src/modules/auth/model/auth.model');
  const sessions = require('../src/modules/auth/service/session.service');
  const Staff = require('../src/modules/staff/model/staff.model');
  const customer = await accounts.createAccount('customer', { fullName: 'Customer', phone: phone(1) });
  const supplier = await accounts.createAccount('supplier', { name: 'Supplier', contacts: { mobile: phone(2) } });
  const admin = await accounts.createAccount('staff', { fullName: 'Admin', phone: phone(3), role: 'admin' });
  const sales = await accounts.createAccount('staff', { fullName: 'Sales', phone: phone(4), role: 'operator', permissions: ['sales'] });
  const supply = await accounts.createAccount('staff', { fullName: 'Supply', phone: phone(5), role: 'operator', permissions: ['supply'] });
  const spareAdmin = await accounts.createAccount('staff', { fullName: 'Spare admin', phone: phone(6), role: 'admin' });
  const legacy = await accounts.createAccount('staff', { fullName: 'Legacy operator', phone: phone(7), role: 'operator' });
  await Staff.collection.updateOne({ _id: legacy._id }, { $unset: { permissions: '' } });
  async function login(phone) { await redis.set(`otp:${phone}`, '123456', 'EX', 120); return auth.verifyOtp(phone, '123456'); }
  const customerLogin = await login(customer.phone), supplierLogin = await login(supplier.contacts.mobile), adminLogin = await login(admin.phone), salesLogin = await login(sales.phone), supplyLogin = await login(supply.phone);
  const server = require('../src/app').listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    sms.sendOtp = originalSms; redisModule.getRedisClient = oldRedis;
    if (oldSecret === undefined) delete process.env.JWT_ACCESS_SECRET; else process.env.JWT_ACCESS_SECRET = oldSecret;
    await redis.quit(); await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  });
  async function request(session, path, method = 'GET', body, extra = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}), ...extra }, body: body && JSON.stringify(body) });
    return { status: response.status, data: await response.json().catch(() => null) };
  }
  const settingsPath = '/settings/authentication';
  await t.test('operators see only their user kind; product writes and opposite departments are protected', async () => {
    for (const [session, kind, opposite] of [[salesLogin, 'customer', 'suppliers'], [supplyLogin, 'supplier', 'customers']]) {
      const rows = await request(session, '/users'); assert.equal(rows.status, 200); assert(rows.data.length > 0); assert(rows.data.every(row => row.role === kind));
      assert.equal((await request(session, `/${opposite}`)).status, 403);
      assert.equal((await request(session, '/staff')).status, 403);
      assert.equal((await request(session, `/staff/${admin._id}`)).status, 403);
      assert.equal((await request(session, `/staff/${sales._id}`, 'PUT', { role: 'admin' })).status, 403);
      assert.equal((await request(session, `/users/staff/${sales._id}`, 'PATCH', { permissions: ['sales', 'supply'] })).status, 403);
      assert.equal((await request(session, '/auth/sessions')).status, 200);
    }
    assert.equal((await request(salesLogin, '/orders/operator?phase=supply')).status, 403);
    assert.equal((await request(supplyLogin, '/orders/operator?phase=sales')).status, 403);
    assert.equal((await request(salesLogin, '/parts', 'POST', {})).status, 403);
    assert.notEqual((await request(supplyLogin, '/parts', 'POST', {})).status, 403, 'supply reaches product validation');
    assert.equal((await request(salesLogin, `/users/supplier/${supplier._id}`, 'PATCH', { isActive: false })).status, 403);
    assert.equal((await request(supplyLogin, `/users/customer/${customer._id}`, 'PATCH', { isActive: false })).status, 403);
    assert.equal((await request(supplyLogin, '/orders/operator/507f1f77bcf86cd799439011/cancel', 'POST', { reason: 'x' })).status, 403);
    assert.equal((await request(salesLogin, '/orders/operator/507f1f77bcf86cd799439011/invitations')).status, 403);
    assert.equal((await request(await login(legacy.phone), `/staff/${legacy._id}`)).data.permissions.length, 2);
  });
  await t.test('granting and revoking scopes changes access immediately without a new login', async () => {
    assert.equal((await request(adminLogin, `/users/staff/${supply._id}`, 'PATCH', { permissions: ['sales', 'supply'] })).status, 200);
    assert.equal((await request(supplyLogin, '/customers')).status, 200);
    assert.equal((await request(adminLogin, `/users/staff/${supply._id}`, 'PATCH', { permissions: ['sales'] })).status, 200);
    assert.equal((await request(supplyLogin, '/suppliers')).status, 403);
    assert.equal((await request(supplyLogin, '/parts', 'POST', {})).status, 403);
    assert.equal((await request(adminLogin, `/users/staff/${supply._id}`, 'PATCH', { permissions: [] })).status, 200);
    assert.equal((await request(supplyLogin, '/users')).status, 403);
    assert.equal((await request(supplyLogin, '/auth/sessions')).status, 200);
    assert.equal((await request(adminLogin, `/users/staff/${supply._id}`, 'PATCH', { permissions: ['injected'] })).status, 400);
    assert.deepEqual((await Staff.findById(supply._id)).permissions, []);
  });
  await t.test('OTP preview is admin-only, random and expires; disabling it rejects previous preview codes and sends SMS', async () => {
    assert.deepEqual((await request(adminLogin, settingsPath)).data, { otpPreviewEnabled: true, revision: 0 });
    for (const session of [null, customerLogin, supplierLogin, salesLogin]) assert([401, 403].includes((await request(session, settingsPath, 'PATCH', { otpPreviewEnabled: true })).status));
    process.env.TEST_AUTH_ENABLED = 'true'; process.env.DEV_AUTH_PHONES = '09128498876'; process.env.DEV_LOGIN_CODE = '112233';
    const one = await auth.requestOtp(phone(8), 'sms'); assert.match(one.otpPreview, /^\d{6}$/); assert.equal(one.expiresIn, 120); assert.equal(sent.length, 0);
    assert.equal(await redis.get(`otp:${phone(8)}`), one.otpPreview); assert(await redis.ttl(`otp:${phone(8)}`) <= 120);
    await assert.rejects(auth.requestOtp(phone(8), 'sms'), { statusCode: 429 });
    assert.equal((await request(adminLogin, settingsPath, 'PATCH', { otpPreviewEnabled: false })).status, 200);
    assert.equal((await request(adminLogin, settingsPath)).data.otpPreviewEnabled, false, 'saved SMS mode overrides the preview default');
    await assert.rejects(auth.verifyOtp(phone(8), one.otpPreview), { statusCode: 400 });
    const two = await auth.requestOtp(phone(9), 'sms'); assert(!Object.hasOwn(two, 'otpPreview')); assert.equal(sent.length, 1); assert.equal(sent[0][0], phone(9));
    for (let n = 0; n < 5; n++) await assert.rejects(auth.verifyOtp(phone(9), 'wrong'), /Invalid OTP/);
    await assert.rejects(auth.verifyOtp(phone(9), sent[0][1]), /Too many failed/);
    sms.sendOtp = async () => { throw new Error('provider private detail'); };
    await assert.rejects(auth.requestOtp(phone(10), 'sms'), { statusCode: 503 }); assert.equal(await redis.get(`otp:${phone(10)}`), null);
    sms.sendOtp = async (...args) => sent.push(args);
    assert.equal((await request(null, '/auth/devlogin', 'POST', { phone: '09128498876', code: '112233' })).status, 404);
  });
  await t.test('unknown numbers verify once before registration, cannot choose admin or another phone', async () => {
    await request(adminLogin, settingsPath, 'PATCH', { otpPreviewEnabled: true });
    const challenge = await auth.requestOtp(phone(11), 'sms');
    const verification = await auth.verifyOtp(phone(11), challenge.otpPreview); assert.equal(verification.registered, false); assert(verification.registrationToken);
    await assert.rejects(auth.verifyOtp(phone(11), challenge.otpPreview), /expired/);
    await assert.rejects(auth.registerAccount('', 'customer', {}), { statusCode: 401 });
    await assert.rejects(auth.registerAccount(verification.registrationToken, 'admin', {}), { statusCode: 401 });
    const result = await auth.registerAccount(verification.registrationToken, 'customer', { fullName: 'New customer', phone: admin.phone, nationalCode: '1234567891', role: 'admin' });
    assert.equal(result.user.phone, phone(11)); assert.equal(result.user.role, 'customer'); assert(result.accessToken);
    await assert.rejects(auth.registerAccount(verification.registrationToken, 'customer', { fullName: 'Duplicate' }), { statusCode: 401 });
  });
  await t.test('deactivation physically deletes indexed, legacy and unindexed refresh tokens; old access stays invalid after reactivation', async () => {
    for (const [kind, profile, phone] of [['customer', customer, customer.phone], ['supplier', supplier, supplier.contacts.mobile], ['staff', sales, sales.phone], ['staff', spareAdmin, spareAdmin.phone]]) {
      const first = await login(phone), second = await login(phone);
      const account = await Auth.findOne({ refId: profile._id });
      const legacyToken = crypto.randomBytes(32).toString('hex'); await redis.set(`refresh:${legacyToken}`, String(account._id), 'EX', 300);
      const unindexed = crypto.randomBytes(32).toString('hex'); await sessions.registerSession(unindexed, account); await redis.srem(`authSessions:${account._id}`, sessions.sessionId(unindexed));
      assert.equal((await request(adminLogin, `/users/${kind}/${profile._id}`, 'PATCH', { isActive: false })).status, 200);
      for (const token of [first.refreshToken, second.refreshToken, legacyToken, unindexed]) {
        assert.equal(await redis.get(`refresh:${token}`), null); assert.equal(await redis.get(`refreshVersion:${token}`), null); assert.equal(await redis.get(`authSession:${sessions.sessionId(token)}`), null);
        await assert.rejects(auth.refreshToken(token), { statusCode: 401 });
      }
      assert.equal(await redis.exists(`authSessions:${account._id}`), 0);
      assert.equal((await request(first, '/auth/sessions')).status, 401);
      await accounts.updateAccount(kind, profile._id, { isActive: true });
      assert.equal((await request(first, '/auth/sessions')).status, 401);
      assert.equal((await request(adminLogin, settingsPath)).status, 200, 'another user stays signed in');
    }
  });
});
