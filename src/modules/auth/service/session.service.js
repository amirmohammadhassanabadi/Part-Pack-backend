const crypto = require("crypto");
const { getRedisClient } = require("../../../core/database/redis");
const TTL = 30 * 24 * 60 * 60;
const sessionId = (token) => crypto.createHash("sha256").update(token).digest("hex");
const fail = (message, statusCode = 401) => { throw Object.assign(new Error(message), { statusCode }); };
const ownerKey = (id) => `authSessions:${id}`;
const deviceKeyFor = (deviceId) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deviceId || "") ? crypto.createHash("sha256").update(deviceId).digest("hex") : null;
const deviceIndexKey = (authId, deviceKey) => `authDevice:${authId}:${deviceKey}`;

async function closeSessionData(redis, data, id) {
  if (!data) return;
  await redis.set(`revokedSession:${id}`, "1", "EX", TTL);
  await redis.del(`refresh:${data.token}`, `refreshVersion:${data.token}`, `authSession:${id}`);
  await redis.srem(ownerKey(data.authId), id);
  if (data.deviceKey) {
    const indexKey = deviceIndexKey(data.authId, data.deviceKey);
    if (await redis.get(indexKey) === id) await redis.del(indexKey);
  }
}

async function registerSession(token, account, context = {}, ttl = TTL, legacy = false) {
  const redis = getRedisClient(), id = sessionId(token);
  if (await redis.get(`revokedSession:${id}`)) fail("نشست پایان یافته است؛ دوباره وارد شوید.");
  const deviceKey = deviceKeyFor(context.deviceId);
  let previousDeviceData = null;
  if (deviceKey) {
    const indexKey = deviceIndexKey(account._id, deviceKey);
    const previousId = await redis.get(indexKey);
    if (previousId && previousId !== id) {
      const previous = JSON.parse(await redis.get(`authSession:${previousId}`) || "null");
      if (previous?.authId === String(account._id)) {
        previousDeviceData = previous;
        await closeSessionData(redis, previous, previousId);
      }
      else await redis.del(indexKey);
    }
  }
  const old = JSON.parse(await redis.get(`authSession:${id}`) || "null");
  const previous = old || previousDeviceData;
  const now = new Date().toISOString();
  const data = {
    id, authId: String(account._id), userId: String(account.refId), role: account.role,
    version: account.sessionVersion || 0, token, deviceKey,
    userAgent: String(context.userAgent || previous?.userAgent || "").slice(0, 500),
    createdAt: previous ? previous.createdAt : (legacy ? null : now), lastActiveAt: legacy ? previous?.lastActiveAt || null : now,
    ipAddress: previous?.ipAddress || context.ipAddress || null,
    lastIpAddress: context.ipAddress || previous?.lastIpAddress || null,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
  };
  await redis.set(`authSession:${id}`, JSON.stringify(data), "EX", ttl);
  await redis.sadd(ownerKey(account._id), id);
  await redis.expire(ownerKey(account._id), TTL);
  if (deviceKey) await redis.set(deviceIndexKey(account._id, deviceKey), id, "EX", ttl);
  return id;
}
async function assertSession(id, user) {
  if (!/^[a-f0-9]{64}$/.test(id || "")) fail("نشست معتبر نیست.");
  const redis = getRedisClient();
  const data = JSON.parse(await redis.get(`authSession:${id}`) || "null");
  if (!data || await redis.get(`revokedSession:${id}`) || data.userId !== String(user.userId) || data.role !== user.role || data.version !== (user.sessionVersion || 0)) fail("نشست این دستگاه پایان یافته است؛ دوباره وارد شوید.");
  return data;
}
async function touchSession(id, context = {}) {
  const redis = getRedisClient();
  const key = `authSession:${id}`;
  const data = JSON.parse(await redis.get(key) || "null");
  if (!data) return;
  const now = Date.now();
  const lastActive = Date.parse(data.lastActiveAt || "") || 0;
  const ipChanged = context.ipAddress && context.ipAddress !== data.lastIpAddress;
  if (!ipChanged && now - lastActive < 5 * 60 * 1000) return;
  if (ipChanged) data.lastIpAddress = context.ipAddress;
  if (now - lastActive >= 5 * 60 * 1000) data.lastActiveAt = new Date(now).toISOString();
  const ttl = await redis.ttl(key);
  if (ttl > 0) await redis.set(key, JSON.stringify(data), "EX", ttl);
}
// Import old refresh tokens once per account without exposing the tokens to the browser.
async function importLegacy(account) {
  const redis = getRedisClient();
  if (await redis.get(`sessionsImported:${account._id}`)) return;
  let cursor = "0";
  do {
    const result = await redis.scan(cursor, "MATCH", "refresh:*", "COUNT", 100);
    cursor = result[0];
    for (const key of result[1]) {
      if (await redis.get(key) !== String(account._id)) continue;
      const token = key.slice(8), id = sessionId(token);
      const ttl = await redis.ttl(key);
      if (ttl <= 0 || await redis.get(`authSession:${id}`) || await redis.get(`revokedSession:${id}`)) continue;
      const version = Number(await redis.get(`refreshVersion:${token}`) || 0);
      if (version === (account.sessionVersion || 0)) await registerSession(token, account, {}, ttl, true);
    }
  } while (cursor !== "0");
  await redis.set(`sessionsImported:${account._id}`, "1", "EX", TTL);
}
async function listSessions(account, currentId) {
  await importLegacy(account);
  const redis = getRedisClient(), result = [];
  for (const id of await redis.smembers(ownerKey(account._id))) {
    const data = JSON.parse(await redis.get(`authSession:${id}`) || "null");
    if (!data || await redis.get(`refresh:${data.token}`) !== String(account._id) || data.authId !== String(account._id) || data.version !== (account.sessionVersion || 0) || await redis.get(`revokedSession:${id}`)) { await redis.srem(ownerKey(account._id), id); continue; }
    result.push({ id, userAgent: data.userAgent, createdAt: data.createdAt, lastActiveAt: data.lastActiveAt, expiresAt: data.expiresAt, ipAddress: data.ipAddress || null, lastIpAddress: data.lastIpAddress || data.ipAddress || null, current: id === currentId });
  }
  return result.sort((a, b) => Number(b.current) - Number(a.current) || String(b.lastActiveAt || "").localeCompare(a.lastActiveAt || ""));
}
async function revokeSession(account, id) {
  if (!/^[a-f0-9]{64}$/.test(id || "")) fail("شناسه نشست نامعتبر است.", 400);
  const redis = getRedisClient();
  const data = JSON.parse(await redis.get(`authSession:${id}`) || "null");
  if (!data || data.authId !== String(account._id)) fail("نشست پیدا نشد.", 404);
  await closeSessionData(redis, data, id);
}
async function closeToken(token) {
  const redis = getRedisClient(), id = sessionId(token);
  const data = JSON.parse(await redis.get(`authSession:${id}`) || "null");
  if (data) await closeSessionData(redis, data, id);
  else await redis.set(`revokedSession:${id}`, "1", "EX", TTL);
}
async function revokeAllSessions(authId) {
  const redis = getRedisClient(), owner = String(authId);
  const tokens = new Set();
  for (const id of await redis.smembers(ownerKey(owner))) {
    const data = JSON.parse(await redis.get(`authSession:${id}`) || "null");
    if (data?.authId === owner) tokens.add(data.token);
  }
  let cursor = "0";
  do {
    const result = await redis.scan(cursor, "MATCH", "refresh:*", "COUNT", 100);
    cursor = result[0];
    for (const key of result[1]) if (await redis.get(key) === owner) tokens.add(key.slice(8));
  } while (cursor !== "0");
  for (const token of tokens) {
    await closeToken(token);
    await redis.del(`refresh:${token}`, `refreshVersion:${token}`);
  }
  cursor = "0";
  do {
    const result = await redis.scan(cursor, "MATCH", "authSession:*", "COUNT", 100);
    cursor = result[0];
    for (const key of result[1]) {
      const data = JSON.parse(await redis.get(key) || "null");
      if (data?.authId === owner) {
        await closeToken(data.token);
        await redis.del(`refresh:${data.token}`, `refreshVersion:${data.token}`);
      }
    }
  } while (cursor !== "0");
  await redis.del(ownerKey(owner), `sessionsImported:${owner}`);
}
module.exports = { revokeAllSessions, sessionId, registerSession, assertSession, touchSession, listSessions, revokeSession, closeToken };
