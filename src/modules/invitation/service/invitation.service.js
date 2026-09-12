const crypto = require("crypto");
const mongoose = require("mongoose");

const Invitation = require("../model/invitation.model");
const Order = require("../../order/model/order.model");
const Supplier = require("../../supplier/model/supplier.model");

async function createInvitation({ orderId, supplierId, partIds }) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  if (!mongoose.isValidObjectId(supplierId)) {
    throw new Error("Invalid supplier ID");
  }

  if (!Array.isArray(partIds) || partIds.length === 0) {
    throw new Error("At least one part is required");
  }

  const invalidPartIds = partIds.filter(
    (id) => !mongoose.isValidObjectId(id),
  );

  if (invalidPartIds.length > 0) {
    throw new Error("Invalid part ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  if (!supplier.isActive) {
    throw new Error("Supplier is not active");
  }

  const existingInvitation = await Invitation.findOne({
    orderId,
    supplierId,
  });

  if (existingInvitation) {
    throw new Error("Invitation already exists for this supplier");
  }

  const orderPartIds = new Set(
    order.items.map((item) => item.partId.toString()),
  );

  const uniquePartIds = [...new Set(partIds.map((id) => id.toString()))];

  const invalidOrderParts = uniquePartIds.filter(
    (partId) => !orderPartIds.has(partId),
  );

  if (invalidOrderParts.length > 0) {
    throw new Error("One or more parts do not belong to this order");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const offers = uniquePartIds.map((partId) => ({
    partId,
    availability: "pending",
    unitPrice: null,
    description: null,
    selected: false,
  }));

  const invitation = await Invitation.create({
    orderId,
    supplierId,
    partIds: uniquePartIds,
    offers,
    token: {
      hash: tokenHash,
      expiresAt,
      usedAt: null,
    },
    lifecycle: {
      status: "sent",
      sentAt: null,
      openedAt: null,
      respondedAt: null,
    },
  });

  return {
    invitation,
    token: rawToken,
  };
}

module.exports = {
  createInvitation,
};