const mongoose = require("mongoose");

function emit(event) {
  console.log(JSON.stringify(event));
}

async function recordEvent({
  orderId,
  type,
  actorType = "system",
  actorId = null,
  supplierId = null,
  invitationId = null,
  invoiceId = null,
  metadata = {},
  session = null,
}) {
  if (!mongoose.isValidObjectId(orderId)) {
    return null;
  }

  const event = {
    timestamp: new Date().toISOString(),
    level: "info",
    event: "business_audit",
    orderId: String(orderId),
    type,
    actorType,
    actorId: mongoose.isValidObjectId(actorId) ? String(actorId) : null,
    supplierId: mongoose.isValidObjectId(supplierId) ? String(supplierId) : null,
    invitationId: mongoose.isValidObjectId(invitationId) ? String(invitationId) : null,
    invoiceId: mongoose.isValidObjectId(invoiceId) ? String(invoiceId) : null,
    metadata,
  };

  // Emit transaction-bound events only after the transaction commits.
  if (session) {
    session._partPaxAuditEvents ||= [];
    session._partPaxAuditEvents.push(event);
    return event;
  }

  emit(event);
  return event;
}

function flushSessionEvents(session) {
  for (const event of session?._partPaxAuditEvents || []) emit(event);
  if (session) delete session._partPaxAuditEvents;
}

function discardSessionEvents(session) {
  if (session) delete session._partPaxAuditEvents;
}

module.exports = { recordEvent, flushSessionEvents, discardSessionEvents };
