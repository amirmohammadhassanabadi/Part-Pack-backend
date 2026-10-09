const mongoose = require("mongoose");

const Order = require("../model/order.model");
const OrderOffer = require("../model/orderOffer.model");
const Invitation = require("../../invitation/model/invitation.model");
const { recordEvent } = require("../../audit/service/audit.service");

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

function validateMarkupPercent(value) {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    const error = new Error("markupPercent must be an integer between 1 and 100");
    error.statusCode = 400;
    throw error;
  }
}

function calculatePricing(baseUnitPrice, markupPercent) {
  if (typeof baseUnitPrice !== "number" || !Number.isFinite(baseUnitPrice) || baseUnitPrice < 0) {
    const error = new Error("baseUnitPrice must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }

  validateMarkupPercent(markupPercent);

  const markupAmount = baseUnitPrice * (markupPercent / 100);
  return {
    markupAmount,
    customerUnitPrice: baseUnitPrice + markupAmount,
  };
}

async function getOrderOrThrow(orderId) {
  assertObjectId(orderId, "order ID");
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  return order;
}

function getOrderItem(order, itemKey) {
  const item = order.items.find(
    (entry) => buildItemKey(entry.partId, entry.carModelId) === itemKey,
  );
  if (!item) {
    const error = new Error(`Order item does not exist: ${itemKey}`);
    error.statusCode = 400;
    throw error;
  }
  return item;
}

async function createOperatorOffer(orderId, payload, operatorId) {
  assertObjectId(operatorId, "operator ID");
  const order = await getOrderOrThrow(orderId);

  if (!["collecting_offers", "operator_review"].includes(order.status)) {
    const error = new Error(`Offers cannot be added when order status is "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const itemKey = String(payload.itemKey || "");
  const orderItem = getOrderItem(order, itemKey);
  const availability = payload.availability || "available";

  if (!["available", "unavailable"].includes(availability)) {
    const error = new Error("availability must be available or unavailable");
    error.statusCode = 400;
    throw error;
  }

  if (availability === "available") {
    if (typeof payload.brandName !== "string" || !payload.brandName.trim()) {
      const error = new Error("brandName is required for an available offer");
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isInteger(payload.availableQuantity) || payload.availableQuantity < 1) {
      const error = new Error("availableQuantity must be a positive integer");
      error.statusCode = 400;
      throw error;
    }
    if (payload.availableQuantity > orderItem.qty) {
      const error = new Error("availableQuantity cannot exceed requested quantity");
      error.statusCode = 400;
      throw error;
    }
    if (typeof payload.baseUnitPrice !== "number" || payload.baseUnitPrice < 0) {
      const error = new Error("baseUnitPrice is required for an available offer");
      error.statusCode = 400;
      throw error;
    }
    validateMarkupPercent(payload.markupPercent);
  } else if (typeof payload.description !== "string" || !payload.description.trim()) {
    const error = new Error("description is required for an unavailable offer");
    error.statusCode = 400;
    throw error;
  }

  const pricing = availability === "available"
    ? calculatePricing(payload.baseUnitPrice, payload.markupPercent)
    : { markupAmount: null, customerUnitPrice: null };

  const offer = await OrderOffer.create({
    orderId: order._id,
    itemKey,
    partId: orderItem.partId,
    carModelId: orderItem.carModelId,
    categoryId: orderItem.categoryId,
    title: orderItem.title,
    source: "operator",
    availability,
    brandName: payload.brandName?.trim(),
    manufacturerName: payload.manufacturerName?.trim() || null,
    partNumber: payload.partNumber?.trim() || null,
    description: payload.description?.trim() || null,
    requestedQuantity: orderItem.qty,
    availableQuantity: availability === "available" ? payload.availableQuantity : 0,
    baseUnitPrice: availability === "available" ? payload.baseUnitPrice : null,
    markupPercent: availability === "available" ? payload.markupPercent : null,
    markupAmount: pricing.markupAmount,
    customerUnitPrice: pricing.customerUnitPrice,
    createdBy: operatorId,
    updatedBy: operatorId,
  });

  await recordEvent({
    orderId: order._id,
    type: "offer_submitted",
    actorType: "operator",
    actorId: operatorId,
    metadata: { orderOfferId: offer._id, itemKey, source: "operator" },
  });

  if (order.status === "collecting_offers") {
    order.status = "operator_review";
    await order.save();
  }

  return offer;
}

async function shortlistOffers(orderId, selections, operatorId) {
  assertObjectId(operatorId, "operator ID");
  const order = await getOrderOrThrow(orderId);

  if (!["collecting_offers", "operator_review", "offers_ready"].includes(order.status)) {
    const error = new Error(`Offers cannot be shortlisted when order status is "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(selections) || selections.length === 0) {
    const error = new Error("selections must contain at least one offer");
    error.statusCode = 400;
    throw error;
  }

  const orderItemKeys = order.items.map((item) => buildItemKey(item.partId, item.carModelId));
  const grouped = new Map();
  for (const selection of selections) {
    if (!selection?.itemKey || !selection?.offerId || !selection?.source) {
      const error = new Error("Each selection requires itemKey, offerId and source");
      error.statusCode = 400;
      throw error;
    }
    if (!["supplier", "operator"].includes(selection.source)) {
      const error = new Error("selection.source must be supplier or operator");
      error.statusCode = 400;
      throw error;
    }
    if (!grouped.has(selection.itemKey)) grouped.set(selection.itemKey, []);
    grouped.get(selection.itemKey).push(selection);
  }

  const missing = orderItemKeys.filter((key) => !grouped.has(key));
  if (missing.length > 0) {
    const error = new Error(`At least one offer is required for every item: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const createdOffers = [];
  for (const selection of selections) {
    const orderItem = getOrderItem(order, selection.itemKey);
    let offer;

    if (selection.source === "operator") {
      assertObjectId(selection.offerId, "operator offer ID");
      offer = await OrderOffer.findOne({
        _id: selection.offerId,
        orderId: order._id,
        itemKey: selection.itemKey,
        source: "operator",
      });
      if (!offer) {
        const error = new Error("Operator offer not found for the selected order item");
        error.statusCode = 404;
        throw error;
      }
      if (offer.availability === "available") {
        validateMarkupPercent(selection.markupPercent ?? offer.markupPercent);
        const pricing = calculatePricing(
          offer.baseUnitPrice,
          selection.markupPercent ?? offer.markupPercent,
        );
        offer.markupPercent = selection.markupPercent ?? offer.markupPercent;
        offer.markupAmount = pricing.markupAmount;
        offer.customerUnitPrice = pricing.customerUnitPrice;
      }
    } else {
      assertObjectId(selection.invitationId, "invitation ID");
      assertObjectId(selection.offerId, "supplier offer ID");
      const invitation = await Invitation.findOne({
        _id: selection.invitationId,
        orderId: order._id,
      });
      const invitationItem = invitation?.items.find((item) => item.itemKey === selection.itemKey);
      const supplierOffer = invitationItem?.offers.id(selection.offerId);
      if (!invitation || !invitationItem || !supplierOffer) {
        const error = new Error("Supplier offer not found for the selected order item");
        error.statusCode = 404;
        throw error;
      }
      if (supplierOffer.availability !== "available") {
        const error = new Error("Only available supplier offers can be shortlisted");
        error.statusCode = 400;
        throw error;
      }
      validateMarkupPercent(selection.markupPercent);
      const pricing = calculatePricing(supplierOffer.unitPrice, selection.markupPercent);
      offer = await OrderOffer.findOneAndUpdate(
        {
          orderId: order._id,
          itemKey: selection.itemKey,
          source: "supplier",
          invitationId: invitation._id,
          invitationOfferId: supplierOffer._id,
        },
        {
          $set: {
            partId: orderItem.partId,
            carModelId: orderItem.carModelId,
            categoryId: orderItem.categoryId,
            title: orderItem.title,
            supplierId: invitation.supplierId,
            availability: supplierOffer.availability,
            brandName: supplierOffer.brandName,
            manufacturerName: supplierOffer.manufacturerName,
            partNumber: supplierOffer.partNumber,
            description: supplierOffer.description,
            requestedQuantity: orderItem.qty,
            availableQuantity: supplierOffer.availableQuantity,
            baseUnitPrice: supplierOffer.unitPrice,
            markupPercent: selection.markupPercent,
            markupAmount: pricing.markupAmount,
            customerUnitPrice: pricing.customerUnitPrice,
            status: "shortlisted",
            shortlistedAt: new Date(),
            shortlistedBy: operatorId,
            updatedBy: operatorId,
          },
          $setOnInsert: { createdBy: operatorId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    offer.status = "shortlisted";
    offer.shortlistedAt = new Date();
    offer.shortlistedBy = operatorId;
    offer.updatedBy = operatorId;
    if (selection.selectedQuantity !== undefined) {
      if (!Number.isInteger(selection.selectedQuantity) || selection.selectedQuantity < 1 || selection.selectedQuantity > offer.availableQuantity) {
        const error = new Error("selectedQuantity must be within the available quantity");
        error.statusCode = 400;
        throw error;
      }
      offer.selectedQuantity = selection.selectedQuantity;
    }
    await offer.save();
    createdOffers.push(offer);
  }

  order.status = "customer_selection";
  await order.save();

  await recordEvent({
    orderId: order._id,
    type: "offers_shortlisted",
    actorType: "operator",
    actorId: operatorId,
    metadata: {
      phase: "shortlist",
      offerIds: createdOffers.map((offer) => offer._id),
    },
  });

  return {
    order,
    offers: createdOffers,
  };
}

async function getCustomerOfferBoard(orderId) {
  assertObjectId(orderId, "order ID");
  return OrderOffer.find({ orderId, status: "shortlisted" })
    .select("orderId itemKey partId carModelId categoryId title availability brandName manufacturerName partNumber description requestedQuantity availableQuantity selectedQuantity customerUnitPrice status")
    .sort({ itemKey: 1, customerUnitPrice: 1 })
    .lean();
}

module.exports = {
  calculatePricing,
  createOperatorOffer,
  shortlistOffers,
  getCustomerOfferBoard,
};

