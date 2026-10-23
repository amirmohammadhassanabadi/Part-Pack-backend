const mongoose = require("mongoose");

async function withTransaction(work, { required = false } = {}) {
  if (!required && process.env.MONGO_TRANSACTIONS !== "true") {
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      session._partPaxAuditEvents = [];
      result = await work(session);
    });
    await require("../../modules/audit/service/audit.service").flushSessionEvents(session);
    return result;
  } catch (error) {
    require("../../modules/audit/service/audit.service").discardSessionEvents(session);
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
