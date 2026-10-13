const mongoose = require("mongoose");

async function withTransaction(work, { required = false } = {}) {
  if (!required && process.env.MONGO_TRANSACTIONS !== "true") {
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (required && (error.code === 20 || error.codeName === "IllegalOperation")) {
      error.statusCode = 503;
      error.message = "This operation requires MongoDB replica-set transactions";
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = { withTransaction };
