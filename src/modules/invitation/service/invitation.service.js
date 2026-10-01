const crypto = require("crypto");
const mongoose = require("mongoose");

const Invitation = require("../model/invitation.model");
const Order = require("../../orders/model/order.model");
const Supplier = require("../../suppliers/model/supplier.model");
const supplierService = require("../../suppliers/service/supplier.service");

const INVITATION_TTL_MS = 30 * 60 * 1000;

function assertObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
}

function buildItemKey(partId, carModelId) {
  return `${String(partId)}:${String(carModelId)}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeAssignments(assignments) {
  const unique = new Map();

  for (const assignment of assignments) {
    assertObjectId(assignment.partId, "part ID");
    assertObjectId(assignment.carModelId, "car model ID");
    assertObjectId(assignment.categoryId, "category ID");

    const itemKey = assignment.itemKey || buildItemKey(
      assignment.partId,
      assignment.carModelId,
    );

    unique.set(itemKey, {
      itemKey,
      partId: assignment.partId,
      carModelId: assignment.carModelId,
      categoryId: assignment.categoryId,
      title: assignment.title,
      requestedQuantity: assignment.requestedQuantity,
    });
  }

  return [...unique.values()];
}

async function createInvitation({ orderId, supplierId, assignments }) {
  assertObjectId(orderId, "order ID");
  assertObjectId(supplierId, "supplier ID");

  if (!Array.isArray(assignments) || assignments.length === 0) {
    const error = new Error("At least one order item is required");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (!["pending", "supplier_invitation"].includes(order.status)) {
    const error = new Error(
      `Invitations cannot be created when order status is "${order.status}"`,
    );
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findOne({ _id: supplierId, isActive: true });
  if (!supplier) {
    const error = new Error("Active supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const existingInvitation = await Invitation.findOne({
    orderId,
    supplierId,
  });
  if (existingInvitation) {
    const error = new Error("Invitation already exists for this supplier");
    error.statusCode = 409;
    throw error;
  }

  const orderItemsByKey = new Map(
    order.items.map((item) => [
      buildItemKey(item.partId, item.carModelId),
      item,
    ]),
  );

  const normalizedAssignments = normalizeAssignments(assignments);
  const items = normalizedAssignments.map((assignment) => {
    const orderItem = orderItemsByKey.get(assignment.itemKey);
    if (!orderItem) {
      const error = new Error(
        `Order item does not exist: ${assignment.itemKey}`,
      );
      error.statusCode = 400;
      throw error;
    }

    return {
      itemKey: assignment.itemKey,
      partId: orderItem.partId,
      carModelId: orderItem.carModelId,
      categoryId: orderItem.categoryId,
      title: orderItem.title,
      requestedQuantity: orderItem.qty,
      offers: [],
    };
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const invitation = await Invitation.create({
    orderId,
    supplierId,
    items,
    token: {
      hash: hashToken(rawToken),
      expiresAt,
      usedAt: null,
    },
    lifecycle: {
      status: "sent",
      sentAt: new Date(),
      openedAt: null,
      respondedAt: null,
    },
  });

  return {
    invitation,
    token: rawToken,
    expiresAt,
  };
}

async function findSuppliersForOrder(orderId) {
  assertObjectId(orderId, "order ID");

  const order = await Order.findById(orderId).populate({
    path: "items.carModelId",
    select: "brand name",
  });

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const suppliersById = new Map();

  for (const item of order.items) {
    if (!item.carModelId || !item.carModelId.brand) {
      continue;
    }

    const suppliers = await supplierService.findSuppliersForOrderItem({
      brandId: item.carModelId.brand,
      carModelId: item.carModelId._id,
      categoryId: item.categoryId,
    });

    for (const supplier of suppliers) {
      const supplierId = supplier._id.toString();
      const itemKey = buildItemKey(item.partId, item.carModelId._id);

      if (!suppliersById.has(supplierId)) {
        suppliersById.set(supplierId, {
          supplierId: supplier._id,
          assignments: [],
        });
      }

      const supplierAssignments = suppliersById.get(supplierId).assignments;
      if (!supplierAssignments.some((assignment) => assignment.itemKey === itemKey)) {
        supplierAssignments.push({
          itemKey,
          partId: item.partId,
          carModelId: item.carModelId._id,
          categoryId: item.categoryId,
          title: item.title,
          requestedQuantity: item.qty,
        });
      }
    }
  }

  return [...suppliersById.values()];
}

async function createInvitationsForOrder(orderId) {
  assertObjectId(orderId, "order ID");

  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (!["pending", "supplier_invitation"].includes(order.status)) {
    const error = new Error(
      `Invitations cannot be created when order status is "${order.status}"`,
    );
    error.statusCode = 400;
    throw error;
  }

  const assignments = await findSuppliersForOrder(orderId);
  const created = [];

  for (const assignment of assignments) {
    const result = await createInvitation({
      orderId,
      supplierId: assignment.supplierId,
      assignments: assignment.assignments,
    });

    created.push({
      supplierId: assignment.supplierId,
      assignments: assignment.assignments,
      invitation: result.invitation,
      token: result.token,
      expiresAt: result.expiresAt,
    });
  }

  order.status = "supplier_invitation";
  await order.save();

  return created;
}

async function getInvitationByToken(rawToken, { markOpened = false } = {}) {
  if (typeof rawToken !== "string" || rawToken.length < 32) {
    const error = new Error("Invalid invitation token");
    error.statusCode = 401;
    throw error;
  }

  const invitation = await Invitation.findOne({
    "token.hash": hashToken(rawToken),
  });

  if (!invitation) {
    const error = new Error("Invitation not found or token is invalid");
    error.statusCode = 404;
    throw error;
  }

  if (
    invitation.lifecycle.status !== "expired" &&
    invitation.token.expiresAt.getTime() <= Date.now()
  ) {
    invitation.lifecycle.status = "expired";
    await invitation.save();
  }

  if (invitation.lifecycle.status === "expired") {
    const error = new Error("Invitation has expired");
    error.statusCode = 410;
    throw error;
  }

  if (markOpened && invitation.lifecycle.status === "sent") {
    invitation.lifecycle.status = "opened";
    invitation.lifecycle.openedAt = new Date();
    await invitation.save();
  }

  return invitation;
}

function normalizeNullableString(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;
  const normalized = value.trim();
  return normalized || null;
}

function validateOfferPayload(payload = {}) {
  const availability = payload.availability;
  if (!["available", "unavailable"].includes(availability)) {
    const error = new Error("Availability must be available or unavailable");
    error.statusCode = 400;
    throw error;
  }
  const brandName = normalizeNullableString(payload.brandName);
  const manufacturerName = normalizeNullableString(payload.manufacturerName);
  const partNumber = normalizeNullableString(payload.partNumber);
  const description = normalizeNullableString(payload.description);
  if (availability === "available") {
    if (!brandName) {
      const error = new Error("brandName is required for an available offer");
      error.statusCode = 400;
      throw error;
    }
    if (typeof payload.unitPrice !== "number" || !Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) {
      const error = new Error("A valid unitPrice is required for an available offer");
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isInteger(payload.availableQuantity) || payload.availableQuantity < 1) {
      const error = new Error("availableQuantity must be a positive integer for an available offer");
      error.statusCode = 400;
      throw error;
    }
  }
  if (availability === "unavailable" && !description) {
    const error = new Error("description is required for an unavailable offer");
    error.statusCode = 400;
    throw error;
  }
  return {
    availability,
    brandName: availability === "available" ? brandName : null,
    manufacturerName: availability === "available" ? manufacturerName : null,
    partNumber: availability === "available" ? partNumber : null,
    unitPrice: availability === "available" ? payload.unitPrice : null,
    availableQuantity: availability === "available" ? payload.availableQuantity : 0,
    description,
  };
}

function getInvitationItem(invitation, itemKey) {
  const item = invitation.items.find((entry) => entry.itemKey === itemKey);
  if (!item) {
    const error = new Error("Invitation item not found");
    error.statusCode = 404;
    throw error;
  }
  return item;
}

async function assertWritableInvitation(rawToken) {
  return getInvitationByToken(rawToken, { markOpened: true });
}

function toSupplierView(invitation) {
  return {
    id: invitation._id,
    orderId: invitation.orderId,
    supplierId: invitation.supplierId,
    items: invitation.items,
    lifecycle: invitation.lifecycle,
    expiresAt: invitation.token.expiresAt,
  };
}

async function markOrderCollectingOffers(orderId) {
  await Order.updateOne(
    { _id: orderId, status: { $in: ["pending", "supplier_invitation"] } },
    { $set: { status: "collecting_offers" } },
  );
}

async function getSupplierInvitation(rawToken) {
  const invitation = await assertWritableInvitation(rawToken);
  return toSupplierView(invitation);
}

async function addOffer(rawToken, itemKey, payload) {
  const invitation = await assertWritableInvitation(rawToken);
  const item = getInvitationItem(invitation, itemKey);
  const offerData = validateOfferPayload(payload);
  item.offers.push(offerData);
  invitation.lifecycle.status = "responded";
  invitation.lifecycle.respondedAt = new Date();
  await invitation.save();
  await markOrderCollectingOffers(invitation.orderId);
  return {
    invitation: toSupplierView(invitation),
    offer: item.offers[item.offers.length - 1],
  };
}

async function updateOffer(rawToken, itemKey, offerId, payload) {
  const invitation = await assertWritableInvitation(rawToken);
  const item = getInvitationItem(invitation, itemKey);
  const offer = item.offers.id(offerId);
  if (!offer) {
    const error = new Error("Offer not found");
    error.statusCode = 404;
    throw error;
  }
  if (offer.selected) {
    const error = new Error("Selected offers cannot be changed by a supplier");
    error.statusCode = 409;
    throw error;
  }
  Object.assign(offer, validateOfferPayload(payload));
  invitation.lifecycle.status = "responded";
  invitation.lifecycle.respondedAt = new Date();
  await invitation.save();
  await markOrderCollectingOffers(invitation.orderId);
  return { invitation: toSupplierView(invitation), offer };
}

async function deleteOffer(rawToken, itemKey, offerId) {
  const invitation = await assertWritableInvitation(rawToken);
  const item = getInvitationItem(invitation, itemKey);
  const offer = item.offers.id(offerId);
  if (!offer) {
    const error = new Error("Offer not found");
    error.statusCode = 404;
    throw error;
  }
  if (offer.selected) {
    const error = new Error("Selected offers cannot be deleted by a supplier");
    error.statusCode = 409;
    throw error;
  }
  offer.deleteOne();
  await invitation.save();
  return toSupplierView(invitation);
}

async function expireDueInvitations() {
  const now = new Date();

  const result = await Invitation.updateMany(
    {
      "token.expiresAt": { $lte: now },
      "lifecycle.status": { $in: ["sent", "opened", "responded"] },
    },
    {
      $set: {
        "lifecycle.status": "expired",
      },
    },
  );

  return { expiredCount: result.modifiedCount || 0 };
}

module.exports = {
  INVITATION_TTL_MS,
  createInvitation,
  findSuppliersForOrder,
  createInvitationsForOrder,
  getInvitationByToken,
  expireDueInvitations,
  getSupplierInvitation,
  addOffer,
  updateOffer,
  deleteOffer,
};