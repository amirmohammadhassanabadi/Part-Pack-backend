const crypto = require("crypto");
const mongoose = require("mongoose");

const Invitation = require("../model/invitation.model");
const Order = require("../../orders/model/order.model");
const Supplier = require("../../suppliers/model/supplier.model");
const CarModel = require("../../vehicles/model/carModel.model");
const OrderOffer = require("../../orders/model/orderOffer.model");
const supplierService = require("../../suppliers/service/supplier.service");
const { recordEvent } = require("../../audit/service/audit.service");
const {
  sendSupplierInvitation,
} = require("../../notification/service/notification.service");

const INVITATION_TTL_MS = 30 * 60 * 1000;

function assertObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
}

function buildItemKey(partId, carModelId) {
  return `${String(partId)}:${carModelId ? String(carModelId) : "*"}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeAssignments(assignments) {
  const unique = new Map();

  for (const assignment of assignments) {
    assertObjectId(assignment.partId, "part ID");
    if (assignment.carModelId) assertObjectId(assignment.carModelId, "car model ID");
    assertObjectId(assignment.categoryId, "category ID");

    const itemKey =
      assignment.itemKey ||
      buildItemKey(assignment.partId, assignment.carModelId);

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

async function createInvitation({
  orderId,
  supplierId,
  assignments,
  session = null,
}) {
  assertObjectId(orderId, "order ID");
  assertObjectId(supplierId, "supplier ID");

  if (!Array.isArray(assignments) || assignments.length === 0) {
    const error = new Error("At least one order item is required");
    error.statusCode = 400;
    throw error;
  }

  const orderQuery = Order.findById(orderId);
  if (session) orderQuery.session(session);
  const order = await orderQuery;
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

  const supplierQuery = Supplier.findOne({ _id: supplierId, isActive: true });
  if (session) supplierQuery.session(session);
  const supplier = await supplierQuery;
  if (!supplier) {
    const error = new Error("Active supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const existingInvitationQuery = Invitation.findOne({
    orderId,
    supplierId,
  });
  if (session) existingInvitationQuery.session(session);
  const existingInvitation = await existingInvitationQuery;
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

  const invitationPayload = {
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
  };
  const [invitation] = session
    ? await Invitation.create([invitationPayload], { session })
    : [await Invitation.create(invitationPayload)];

  await recordEvent({
    orderId,
    type: "supplier_invitation_created",
    supplierId,
    invitationId: invitation._id,
    metadata: {
      itemCount: items.length,
      expiresAt,
    },
    session,
  });

  await sendSupplierInvitation({
    orderId,
    supplierId,
    token: rawToken,
    expiresAt,
  });

  return {
    invitation,
    token: rawToken,
    expiresAt,
  };
}

async function findSuppliersForOrder(orderId, session = null) {
  assertObjectId(orderId, "order ID");

  const orderQuery = Order.findById(orderId)
    .populate({ path: "items.carModelId", select: "brand name" })
    .populate({ path: "items.partId", select: "name compatibility" });
  if (session) orderQuery.session(session);
  const order = await orderQuery;

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const suppliersById = new Map();

  for (const item of order.items) {
    const compatibleModels = item.carModelId
      ? [item.carModelId]
      : await CarModel.find({ _id: { $in: item.partId?.compatibility || [] } }).select("brand name").lean();
    const supplierLists = await Promise.all(
      compatibleModels.filter((model) => model?.brand).map((model) =>
        supplierService.findSuppliersForOrderItem({
          brandId: model.brand,
          carModelId: model._id,
          categoryId: item.categoryId,
        }),
      ),
    );
    const suppliers = [...new Map(supplierLists.flat().map((supplier) => [String(supplier._id), supplier])).values()];

    for (const supplier of suppliers) {
      const supplierId = supplier._id.toString();
      const itemKey = buildItemKey(item.partId?._id || item.partId, item.carModelId?._id || null);

      if (!suppliersById.has(supplierId)) {
        suppliersById.set(supplierId, {
          supplierId: supplier._id,
          assignments: [],
        });
      }

      const supplierAssignments = suppliersById.get(supplierId).assignments;
      if (
        !supplierAssignments.some(
          (assignment) => assignment.itemKey === itemKey,
        )
      ) {
        supplierAssignments.push({
          itemKey,
          partId: item.partId?._id || item.partId,
          carModelId: item.carModelId?._id || null,
          categoryId: item.categoryId,
          title: item.title,
          requestedQuantity: item.qty,
        });
      }
    }
  }

  return [...suppliersById.values()];
}

async function createInvitationsForOrder(orderId, { session = null } = {}) {
  assertObjectId(orderId, "order ID");

  const orderQuery = Order.findById(orderId);
  if (session) orderQuery.session(session);
  const order = await orderQuery;
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

  const assignments = await findSuppliersForOrder(orderId, session);
  const created = [];

  for (const assignment of assignments) {
    const result = await createInvitation({
      orderId,
      supplierId: assignment.supplierId,
      assignments: assignment.assignments,
      session,
    });

    created.push({
      supplierId: assignment.supplierId,
      assignments: assignment.assignments,
      invitation: result.invitation,
      token: result.token,
      expiresAt: result.expiresAt,
    });
  }

  order.status = created.length > 0 ? "supplier_invitation" : "operator_review";
  await order.save(session ? { session } : undefined);

  return created;
}

async function deleteInvitationsForOrder(orderId) {
  return Invitation.deleteMany({ orderId });
}

async function getInvitation(rawToken, { markOpened = false, supplierId = null, allowExpired = false } = {}) {
  if (supplierId) {
    assertObjectId(rawToken, "invitation ID");
    assertObjectId(supplierId, "supplier ID");
  } else if (typeof rawToken !== "string" || rawToken.length < 32) {
    const error = new Error("Invalid invitation token");
    error.statusCode = 401;
    throw error;
  }

  const invitation = await Invitation.findOne(supplierId
    ? { _id: rawToken, supplierId }
    : { "token.hash": hashToken(rawToken) });

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

  if (invitation.lifecycle.status === "expired" && !allowExpired) {
    const error = new Error("Invitation has expired");
    error.statusCode = 410;
    throw error;
  }

  const wasSent = invitation.lifecycle.status === "sent";
  if (markOpened && wasSent) {
    invitation.lifecycle.status = "opened";
    invitation.lifecycle.openedAt = new Date();
    await invitation.save();

    await recordEvent({
      orderId: invitation.orderId,
      type: "invitation_opened",
      actorType: "supplier",
      actorId: invitation.supplierId,
      supplierId: invitation.supplierId,
      invitationId: invitation._id,
    });
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
    if (
      typeof payload.unitPrice !== "number" ||
      !Number.isFinite(payload.unitPrice) ||
      payload.unitPrice < 0
    ) {
      const error = new Error(
        "A valid unitPrice is required for an available offer",
      );
      error.statusCode = 400;
      throw error;
    }
    if (
      !Number.isInteger(payload.availableQuantity) ||
      payload.availableQuantity < 1
    ) {
      const error = new Error(
        "availableQuantity must be a positive integer for an available offer",
      );
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
    availableQuantity:
      availability === "available" ? payload.availableQuantity : 0,
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

async function getInvitationByToken(rawToken, options = {}) {
  return getInvitation(rawToken, { markOpened: options.markOpened });
}

async function assertWritableInvitation(rawToken, supplierId) {
  return getInvitation(rawToken, { markOpened: true, supplierId });
}

function toSupplierView(invitation) {
  return {
    id: invitation._id,
    orderId: invitation.orderId,
    supplierId: invitation.supplierId,
    items: invitation.items,
    lifecycle: invitation.lifecycle,
    expiresAt: invitation.token.expiresAt,
    createdAt: invitation.createdAt,
  };
}

async function markOrderCollectingOffers(orderId) {
  await Order.updateOne(
    { _id: orderId, status: { $in: ["pending", "supplier_invitation"] } },
    { $set: { status: "collecting_offers" } },
  );
}

async function listSupplierInvitations(supplierId, { page = 1, limit = 20, status, search, from, to } = {}) {
  assertObjectId(supplierId, "supplier ID");
  await expireDueInvitations();
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const filter = { supplierId };
  if (status && status !== "all") filter["lifecycle.status"] = status;
  if (search?.trim()) {
    const term = search.trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ "items.title": { $regex: escaped, $options: "i" } }];
    if (mongoose.isValidObjectId(term)) filter.$or.push({ orderId: term });
  }
  if (from || to) {
    filter.createdAt = {};
    for (const [value, operator] of [[from, "$gte"], [to, "$lt"]]) {
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        const error = new Error("Invalid date filter");
        error.statusCode = 400;
        throw error;
      }
      filter.createdAt[operator] = date;
    }
  }
  const [invitations, total] = await Promise.all([
    Invitation.find(filter).sort({ createdAt: -1, _id: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize),
    Invitation.countDocuments(filter),
  ]);
  return { invitations: invitations.map(toSupplierView), pagination: { page: currentPage, limit: pageSize, total, pages: Math.ceil(total / pageSize) } };
}

async function getSupplierInvitation(rawToken, supplierId = null) {
  const invitation = await getInvitation(rawToken, { markOpened: true, supplierId, allowExpired: Boolean(supplierId) });
  return toSupplierView(invitation);
}

async function addOffer(rawToken, itemKey, payload, supplierId = null) {
  const invitation = await assertWritableInvitation(rawToken, supplierId);
  const item = getInvitationItem(invitation, itemKey);
  const offerData = validateOfferPayload(payload);
  item.offers.push(offerData);
  invitation.lifecycle.status = "responded";
  invitation.lifecycle.respondedAt = new Date();
  await invitation.save();
  await markOrderCollectingOffers(invitation.orderId);
  await recordEvent({
    orderId: invitation.orderId,
    type: "offer_submitted",
    actorType: "supplier",
    actorId: invitation.supplierId,
    supplierId: invitation.supplierId,
    invitationId: invitation._id,
    metadata: {
      itemKey,
      offerId: item.offers[item.offers.length - 1]._id,
      availability: offerData.availability,
      brandName: offerData.brandName,
      unitPrice: offerData.unitPrice,
      availableQuantity: offerData.availableQuantity,
    },
  });
  return {
    invitation: toSupplierView(invitation),
    offer: item.offers[item.offers.length - 1],
  };
}

async function updateOffer(rawToken, itemKey, offerId, payload, supplierId = null) {
  const invitation = await assertWritableInvitation(rawToken, supplierId);
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
  await recordEvent({
    orderId: invitation.orderId,
    type: "offer_updated",
    actorType: "supplier",
    actorId: invitation.supplierId,
    supplierId: invitation.supplierId,
    invitationId: invitation._id,
    metadata: { itemKey, offerId },
  });
  return { invitation: toSupplierView(invitation), offer };
}

async function deleteOffer(rawToken, itemKey, offerId, supplierId = null) {
  const invitation = await assertWritableInvitation(rawToken, supplierId);
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
  await recordEvent({
    orderId: invitation.orderId,
    type: "offer_deleted",
    actorType: "supplier",
    actorId: invitation.supplierId,
    supplierId: invitation.supplierId,
    invitationId: invitation._id,
    metadata: { itemKey, offerId },
  });
  return toSupplierView(invitation);
}

async function getOperatorOrderInvitations(orderId) {
  assertObjectId(orderId, "order ID");
  await expireDueInvitations();

  const order = await Order.findById(orderId).select("_id status").lean();
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const invitations = await Invitation.find({ orderId })
    .populate("supplierId", "name contacts isActive")
    .populate("items.partId", "name")
    .populate("items.carModelId", "name brand")
    .populate("items.categoryId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const safeInvitations = invitations.map((invitation) => {
    if (invitation.token) {
      delete invitation.token.hash;
      delete invitation.token.usedAt;
    }
    return invitation;
  });

  return {
    orderId: order._id,
    orderStatus: order.status,
    invitations: safeInvitations,
  };
}

async function getOperatorOfferBoard(orderId) {
  assertObjectId(orderId, "order ID");
  await expireDueInvitations();

  const order = await Order.findById(orderId)
    .populate("items.partId", "name")
    .populate("items.carModelId", "name brand")
    .populate("items.categoryId", "name")
    .lean();

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const invitations = await Invitation.find({ orderId })
    .populate("supplierId", "name contacts isActive")
    .lean();
  const operatorOffers = await OrderOffer.find({ orderId, source: "operator" }).lean();
  const publishedOffers = await OrderOffer.find({ orderId, status: { $in: ["shortlisted", "selected"] } }).lean();

  const offersByItemKey = new Map();
  for (const invitation of invitations) {
    const supplier = invitation.supplierId;
    for (const item of invitation.items) {
      if (!offersByItemKey.has(item.itemKey)) {
        offersByItemKey.set(item.itemKey, []);
      }

      for (const offer of item.offers) {
        offersByItemKey.get(item.itemKey).push({
          ...offer,
          invitationId: invitation._id,
          supplierId: supplier?._id || supplier,
          supplierName: supplier?.name || null,
          invitationStatus: invitation.lifecycle.status,
          invitationExpiresAt: invitation.token.expiresAt,
        });
      }
    }
  }

  const items = order.items.map((item) => {
    const itemKey = buildItemKey(
      item.partId?._id || item.partId,
      item.carModelId?._id || item.carModelId,
    );
    const offers = offersByItemKey.get(itemKey) || [];

    return {
      itemKey,
      partId: item.partId,
      carModelId: item.carModelId,
      categoryId: item.categoryId,
      title: item.title,
      requestedQuantity: item.qty,
      currentAvailability: item.availability,
      offers,
      operatorOffers: operatorOffers.filter((offer) => offer.itemKey === itemKey),
      publishedOffers: publishedOffers.filter((offer) => offer.itemKey === itemKey),
      hasOffers: offers.length > 0,
    };
  });

  return {
    orderId: order._id,
    orderStatus: order.status,
    invitationsCount: invitations.length,
    currency: "IRR",
    items,
  };
}

async function selectOrderOffers(orderId, selections, operatorId) {
  const error = new Error("Use shortlist-offers to publish options for customer selection");
  error.statusCode = 410;
  throw error;
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

  const waitingOrders = await Order.find({ status: { $in: ["supplier_invitation", "collecting_offers"] } }).select("_id").lean();
  const orderIds = waitingOrders.map((entry) => entry._id);
  const activeOrderIds = await Invitation.distinct("orderId", {
    orderId: { $in: orderIds },
    "lifecycle.status": { $in: ["sent", "opened", "responded"] },
  });
  const reviewed = await Order.updateMany(
    { _id: { $in: orderIds, $nin: activeOrderIds }, status: { $in: ["supplier_invitation", "collecting_offers"] } },
    { $set: { status: "operator_review" } },
  );
  const reviewCount = reviewed.modifiedCount || 0;
  return { expiredCount: result.modifiedCount || 0, reviewCount };
}

module.exports = {
  INVITATION_TTL_MS,
  createInvitation,
  findSuppliersForOrder,
  createInvitationsForOrder,
  deleteInvitationsForOrder,
  getInvitationByToken,
  expireDueInvitations,
  getSupplierInvitation,
  listSupplierInvitations,
  addOffer,
  updateOffer,
  deleteOffer,
  getOperatorOrderInvitations,
  getOperatorOfferBoard,
  selectOrderOffers,
};
