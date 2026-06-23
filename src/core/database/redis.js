const Redis = require("ioredis");

let redisClient;

async function connectRedis() {
  try {
    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("error", (error) => {
      console.error("❌ Redis connection error:", error.message);
    });

    // ioredis does not expose a promise-based connect — ping confirms readiness
    await redisClient.ping();

    console.log("Redis connected successfully - " + process.env.REDIS_URL);
  } catch (error) {
    console.error(`❌ Redis connection failed: ${process.env.REDIS_URL}`, error.message);
    process.exit(1);
  }
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client is not initialized. Call connectRedis() first.");
  }
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };