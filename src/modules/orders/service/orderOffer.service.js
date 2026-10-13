const mongoose = require("mongoose");

const Order = require("../model/order.model");
const OrderOffer = require("../model/orderOffer.model");
const Invitation = require("../../invitation/model/invitation.model");
const { recordEvent } = require("../../audit/service/audit.service");
const { withTransaction } = require("../../../core/database/transaction");

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function assertObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) fail(`Invalid ${fieldName}`);
}

function buildItemKey(partId, carModelId) {
  return `${String(partId)}:${carModelId ? String(carModelId) : "*"}`;
}

function validateMarkupPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    fail("markupPercent must be between 0 and 100");
  }
}

function calculatePricing(baseUnitPrice, markupPercent) {
  if (!Number.isSafeInteger(baseUnitPrice) || baseUnitPrice < 0) {
    fail("baseUnitPrice must be a non-negative integer in IRR");
  }
  validateMarkupPercent(markupPercent);
  const customerUnitPrice = Math.round(baseUnitPrice * (1 + markupPercent / 100));
  if (!Number.isSafeInteger(customerUnitPrice)) fail("Price exceeds the supported amount");
  return { markupAmount: customerUnitPrice - baseUnitPrice, customerUnitPrice };
}

async function getOrderOrThrow(orderId, session = null) {
  assertObjectId(orderId, "order ID");
  const order = await Order.findById(orderId).session(session);
  if (!order) fail("Order not found", 404);
  return order;
}

function getOrderItem(order, itemKey) {
  const item = order.items.find((entry) => buildItemKey(entry.partId, entry.carModelId) === itemKey);
  if (!item) fail(`Order item does not exist: ${itemKey}`);
  return item;
}

async function assertReview(order) {
  const { expireDueInvitations } = require("../../invitation/service/invitation.service");
  await expireDueInvitations();
  const refreshed = await Order.findById(order._id).select("status");
  if (!["operator_review", "offers_ready"].includes(refreshed?.status)) {
    fail("Pricing is available only after the quotation deadline");
  }
  order.status = refreshed.status;
}

async function createOperatorOffer(orderId, payload = {}, operatorId) {
  assertObjectId(operatorId, "operator ID");
  const order = await getOrderOrThrow(orderId);
  await assertReview(order);
  const itemKey = String(payload.itemKey || "");
  const item = getOrderItem(order, itemKey);
  const availability = payload.availability || "available";
  if (!["available", "unavailable"].includes(availability)) fail("Invalid availability");
  if (availability === "available") {
    if (typeof payload.brandName !== "string" || !payload.brandName.trim()) fail("brandName is required");
    if (!Number.isInteger(payload.availableQuantity) || payload.availableQuantity < 1 || payload.availableQuantity > item.qty) {
      fail("availableQuantity must be within the requested quantity");
    }
  } else if (typeof payload.description !== "string" || !payload.description.trim()) {
    fail("description is required for an unavailable offer");
  }
  const pricing = availability === "available"
    ? calculatePricing(payload.baseUnitPrice, payload.markupPercent)
    : { markupAmount: 0, customerUnitPrice: 0 };
  const offer = await OrderOffer.create({
    orderId: order._id, itemKey, partId: item.partId, carModelId: item.carModelId,
    categoryId: item.categoryId, title: item.title, source: "operator", availability,
    brandName: typeof payload.brandName === "string" ? payload.brandName.trim() : null,
    manufacturerName: payload.manufacturerName || null, partNumber: payload.partNumber || null,
    description: payload.description || null, requestedQuantity: item.qty,
    availableQuantity: availability === "available" ? payload.availableQuantity : 0,
    baseUnitPrice: availability === "available" ? payload.baseUnitPrice : 0,
    markupPercent: availability === "available" ? payload.markupPercent : 0,
    ...pricing, createdBy: operatorId, updatedBy: operatorId,
  });
  await recordEvent({ orderId, type: "offer_submitted", actorType: "operator", actorId: operatorId,
    metadata: { orderOfferId: offer._id, itemKey, source: "operator" } });
  return offer;
}

async function shortlistOffers(orderId, selections, operatorId) {
  assertObjectId(operatorId, "operator ID");
  const initial = await getOrderOrThrow(orderId);
  await assertReview(initial);
  if (!Array.isArray(selections)) fail("selections must be an array");

  return withTransaction(async (session) => {
    const order = await getOrderOrThrow(orderId, session);
    if (!["operator_review", "offers_ready"].includes(order.status)) fail("Order is no longer ready for pricing", 409);
    const prepared = [];
    const unique = new Set();
    for (const selection of selections) {
      const item = getOrderItem(order, selection?.itemKey);
      if (!["supplier", "operator"].includes(selection.source)) fail("Invalid offer source");
      assertObjectId(selection.offerId, "offer ID");
      const key = `${selection.source}:${selection.offerId}`;
      if (unique.has(key)) fail("Duplicate offer selection");
      unique.add(key);
      let offer;
      if (selection.source === "operator") {
        offer = await OrderOffer.findOne({ _id: selection.offerId, orderId, itemKey: selection.itemKey, source: "operator" }).session(session);
        if (!offer) fail("Operator offer not found", 404);
        if (offer.availability === "available") {
          offer.markupPercent = selection.markupPercent ?? offer.markupPercent;
          Object.assign(offer, calculatePricing(offer.baseUnitPrice, offer.markupPercent));
        }
      } else {
        assertObjectId(selection.invitationId, "invitation ID");
        const invitation = await Invitation.findOne({ _id: selection.invitationId, orderId }).session(session);
        const supplierOffer = invitation?.items.find((entry) => entry.itemKey === selection.itemKey)?.offers.id(selection.offerId);
        if (!supplierOffer || supplierOffer.availability !== "available") fail("Available supplier offer not found", 404);
        const pricing = calculatePricing(supplierOffer.unitPrice, selection.markupPercent);
        offer = await OrderOffer.findOne({ orderId, invitationId: invitation._id, invitationOfferId: supplierOffer._id }).session(session);
        if (!offer) offer = new OrderOffer({ orderId, itemKey: selection.itemKey, source: "supplier", createdBy: operatorId });
        Object.assign(offer, {
          partId: item.partId, carModelId: item.carModelId, categoryId: item.categoryId, title: item.title,
          invitationId: invitation._id, invitationOfferId: supplierOffer._id, supplierId: invitation.supplierId,
          availability: "available", brandName: supplierOffer.brandName, manufacturerName: supplierOffer.manufacturerName,
          partNumber: supplierOffer.partNumber, description: supplierOffer.description, requestedQuantity: item.qty,
          availableQuantity: supplierOffer.availableQuantity, baseUnitPrice: supplierOffer.unitPrice,
          markupPercent: selection.markupPercent, ...pricing,
        });
      }
      const quantity = selection.selectedQuantity ?? Math.min(item.qty, offer.availableQuantity);
      if (offer.availability === "available" && (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > item.qty || quantity > offer.availableQuantity)) {
        fail("selectedQuantity is outside the requested/available quantity");
      }
      offer.selectedQuantity = offer.availability === "available" ? quantity : null;
      offer.status = "shortlisted";
      offer.shortlistedAt = new Date();
      offer.shortlistedBy = operatorId;
      offer.updatedBy = operatorId;
      await offer.validate();
      prepared.push(offer);
    }
    // A line with no published option remains on the order as unavailable.
    for (const item of order.items) {
      const itemKey = buildItemKey(item.partId, item.carModelId);
      if (!prepared.some((offer) => offer.itemKey === itemKey)) {
        prepared.push(new OrderOffer({ orderId, itemKey, partId: item.partId, carModelId: item.carModelId,
          categoryId: item.categoryId, title: item.title, source: "operator", availability: "unavailable",
          description: "برای این قطعه گزینه‌ای ارائه نشده است", requestedQuantity: item.qty,
          availableQuantity: 0, baseUnitPrice: 0, markupPercent: 0, markupAmount: 0, customerUnitPrice: 0,
          status: "shortlisted", shortlistedAt: new Date(), shortlistedBy: operatorId, createdBy: operatorId,
        }));
      }
    }
    await OrderOffer.updateMany({ orderId, status: "shortlisted" }, { $set: { status: "rejected" } }, { session });
    for (const offer of prepared) await offer.save({ session });
    for (const item of order.items) {
      const itemKey = buildItemKey(item.partId, item.carModelId);
      if (!prepared.some((offer) => offer.itemKey === itemKey && offer.availability === "available")) {
        item.availability = { status: "unavailable", description: prepared.find((offer) => offer.itemKey === itemKey)?.description || "بدون قیمت" };
        item.unitPrice = 0;
        item.selectedOffer = null;
      }
    }
    order.status = "customer_selection";
    await order.save({ session });
    await recordEvent({ orderId, type: "offers_shortlisted", actorType: "operator", actorId: operatorId,
      metadata: { offerIds: prepared.map((offer) => offer._id) }, session });
    return { order, offers: prepared };
  }, { required: true });
}

async function getCustomerOfferBoard(orderId, customerId) {
  assertObjectId(orderId, "order ID");
  assertObjectId(customerId, "customer ID");
  const order = await Order.findOne({ _id: orderId, "customer.customerId": customerId }).lean();
  if (!order) fail("Order not found", 404);
  if (order.status !== "customer_selection") fail("Offers are not ready for selection");
  const offers = await OrderOffer.find({ orderId, status: "shortlisted" })
    .select("itemKey title availability brandName manufacturerName partNumber description requestedQuantity availableQuantity selectedQuantity customerUnitPrice")
    .sort({ itemKey: 1, customerUnitPrice: 1 }).lean();
  return { orderId, orderStatus: order.status, currency: "IRR", items: order.items.map((item) => {
    const itemKey = buildItemKey(item.partId, item.carModelId);
    return { itemKey, partId: item.partId, title: item.title, requestedQuantity: item.qty,
      offers: offers.filter((offer) => offer.itemKey === itemKey) };
  }) };
}

async function selectCustomerOffers(orderId, selections, customerId) {
  assertObjectId(orderId, "order ID");
  assertObjectId(customerId, "customer ID");
  if (!Array.isArray(selections)) fail("selections must be an array");
  return withTransaction(async (session) => {
    const order = await Order.findOne({ _id: orderId, "customer.customerId": customerId }).session(session);
    if (!order) fail("Order not found", 404);
    if (order.status !== "customer_selection") fail("Order is not accepting selections", 409);
    const decisions = new Map();
    for (const selection of selections) {
      getOrderItem(order, selection?.itemKey);
      assertObjectId(selection.offerId, "offer ID");
      if (decisions.has(selection.itemKey)) fail("Duplicate item selection");
      decisions.set(selection.itemKey, selection);
    }
    const offers = await OrderOffer.find({ orderId, status: "shortlisted" }).session(session);
    const selected = [];
    for (const item of order.items) {
      const itemKey = buildItemKey(item.partId, item.carModelId);
      const selection = decisions.get(itemKey);
      const itemOffers = offers.filter((offer) => offer.itemKey === itemKey);
      if (!itemOffers.some((offer) => offer.availability === "available")) {
        if (selection) fail("Unavailable items cannot be selected");
        item.availability = { status: "unavailable", description: itemOffers[0]?.description || "بدون قیمت" };
        item.unitPrice = 0;
        item.selectedOffer = null;
        continue;
      }
      if (!selection) fail(`Select one offer for item ${itemKey}`);
      const offer = itemOffers.find((entry) => String(entry._id) === String(selection.offerId));
      if (!offer || offer.availability !== "available") fail("Selected offer must be available and belong to the item");
      const quantity = selection.selectedQuantity ?? offer.selectedQuantity ?? Math.min(item.qty, offer.availableQuantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > item.qty || quantity > offer.availableQuantity) fail("Invalid selectedQuantity");
      item.availability = { status: "available", description: offer.description || null };
      if (!Number.isSafeInteger(quantity * offer.customerUnitPrice)) fail("Line total exceeds the supported amount");
      item.unitPrice = offer.customerUnitPrice;
      item.selectedOffer = {
        invitationId: offer.invitationId, orderOfferId: offer._id, supplierId: offer.supplierId,
        offerId: offer.invitationOfferId || offer._id, brandName: offer.brandName,
        manufacturerName: offer.manufacturerName, partNumber: offer.partNumber,
        unitPrice: offer.customerUnitPrice, baseUnitPrice: offer.baseUnitPrice,
        markupPercent: offer.markupPercent, markupAmount: offer.markupAmount,
        customerUnitPrice: offer.customerUnitPrice, source: offer.source,
        selectedQuantity: quantity, selectedAt: new Date(), selectedBy: customerId,
      };
      offer.status = "selected";
      offer.selectedQuantity = quantity;
      offer.selectedAt = new Date();
      offer.selectedBy = customerId;
      selected.push(offer);
    }
    if (!selected.length) fail("At least one available item is required to continue");
    for (const offer of selected) await offer.save({ session });
    await OrderOffer.updateMany({ orderId, status: "shortlisted", availability: "available" }, { $set: { status: "rejected" } }, { session });
    order.status = "awaiting_payment";
    await order.save({ session });
    const { createInvoiceFromOrder } = require("../../invoice/service/invoice.service");
    const invoice = await createInvoiceFromOrder(order._id, { session });
    order.invoiceId = invoice._id;
    await recordEvent({ orderId, type: "offers_selected", actorType: "customer", actorId: customerId,
      metadata: { offerIds: selected.map((offer) => offer._id) }, session });
    return order;
  }, { required: true });
}

module.exports = { calculatePricing, createOperatorOffer, shortlistOffers, getCustomerOfferBoard, selectCustomerOffers };
