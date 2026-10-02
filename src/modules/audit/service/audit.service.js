const mongoose = require("mongoose");
const AuditEvent = require("../model/auditEvent.model");
const Order = require("../../orders/model/order.model");

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

  try {
    const payload = {
      orderId,
      type,
      actorType,
      actorId: mongoose.isValidObjectId(actorId) ? actorId : null,
      supplierId: mongoose.isValidObjectId(supplierId) ? supplierId : null,
      invitationId: mongoose.isValidObjectId(invitationId) ? invitationId : null,
      invoiceId: mongoose.isValidObjectId(invoiceId) ? invoiceId : null,
      metadata,
    };
    const created = session
      ? await AuditEvent.create([payload], { session })
      : [await AuditEvent.create(payload)];
    return created[0];
  } catch (error) {
    if (session) throw error;
    // Non-transactional audit logging must not break the business operation.
    console.error("Failed to record audit event:", error.message);
    return null;
  }
}

async function getOrderEvents(orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.exists({ _id: orderId });
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return AuditEvent.find({ orderId })
    .populate("supplierId", "name")
    .populate("invitationId", "lifecycle.status token.expiresAt")
    .populate("invoiceId", "status total")
    .sort({ createdAt: 1 })
    .lean();
}

module.exports = { recordEvent, getOrderEvents };
