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
}) {
  if (!mongoose.isValidObjectId(orderId)) {
    return null;
  }

  try {
    return await AuditEvent.create({
      orderId,
      type,
      actorType,
      actorId: mongoose.isValidObjectId(actorId) ? actorId : null,
      supplierId: mongoose.isValidObjectId(supplierId) ? supplierId : null,
      invitationId: mongoose.isValidObjectId(invitationId) ? invitationId : null,
      invoiceId: mongoose.isValidObjectId(invoiceId) ? invoiceId : null,
      metadata,
    });
  } catch (error) {
    // Audit logging must not break the business operation it observes.
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
