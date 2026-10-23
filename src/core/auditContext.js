const { AsyncLocalStorage } = require("async_hooks");

const storage = new AsyncLocalStorage();

function runWithAuditContext(context, callback) {
  return storage.run(context, callback);
}

function getAuditContext() {
  return storage.getStore() || {};
}

module.exports = { runWithAuditContext, getAuditContext };
