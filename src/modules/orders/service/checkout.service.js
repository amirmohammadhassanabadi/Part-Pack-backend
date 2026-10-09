const mongoose = require("mongoose");
const Order = require("../model/order.model");
const Customer = require("../../customer/model/customer.model");
const { recordEvent } = require("../../audit/service/audit.service");
const { withTransaction } = require("../../../core/database/transaction");

function assertObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
}

function normalizeAddress(address) {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    const error = new Error("address is required");
    error.statusCode = 400;
    throw error;
  }

  const fields = ["title", "province", "city", "line"];
  for (const field of fields) {
    if (typeof address[field] !== "string" || !address[field].trim()) {
      const error = new Error(`address.${field} is required`);
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    title: address.title.trim(),
    province: address.province.trim(),
    city: address.city.trim(),
    line: address.line.trim(),
    postalCode:
      typeof address.postalCode === "string" && address.postalCode.trim()
        ? address.postalCode.trim()
        : null,
  };
}

async function prepareCheckout(orderId, customerId, payload = {}) {
  assertObjectId(orderId, "order ID");
  assertObjectId(customerId, "customer ID");

  return withTransaction(async (session) => {
    const orderQuery = Order.findOne({
      _id: orderId,
      "customer.customerId": customerId,
    });
    if (session) orderQuery.session(session);
    const order = await orderQuery;

    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    if (order.status !== "awaiting_payment") {
      const error = new Error(`Checkout cannot be prepared from status "${order.status}"`);
      error.statusCode = 400;
      throw error;
    }

    let address;
    let addressId = null;
    const customerQuery = Customer.findOne({ _id: customerId, isActive: true });
    if (session) customerQuery.session(session);
    const customer = await customerQuery;
    if (!customer) {
      const error = new Error("Customer not found");
      error.statusCode = 404;
      throw error;
    }

    if (payload.addressId !== undefined) {
      assertObjectId(payload.addressId, "address ID");
      const savedAddress = customer.addresses.id(payload.addressId);
      if (!savedAddress) {
        const error = new Error("Address not found for this customer");
        error.statusCode = 404;
        throw error;
      }
      addressId = savedAddress._id;
      address = normalizeAddress(savedAddress.toObject());
    } else {
      address = normalizeAddress(payload.address);
      const savedAddress = customer.addresses.create(address);
      customer.addresses.push(savedAddress);
      addressId = savedAddress._id;
      await customer.save(session ? { session } : undefined);
    }

    const availableItems = order.items.filter(
      (item) => item.availability.status === "available" && item.selectedOffer,
    );
    if (availableItems.length === 0) {
      const error = new Error("At least one selected available item is required");
      error.statusCode = 400;
      throw error;
    }

    let subtotal = 0;
    for (const item of order.items) {
      if (item.availability.status === "unavailable") continue;
      const quantity = item.selectedOffer?.selectedQuantity;
      const unitPrice = item.selectedOffer?.customerUnitPrice ?? item.unitPrice;
      if (!Number.isInteger(quantity) || quantity < 1 || typeof unitPrice !== "number" || unitPrice < 0) {
        const error = new Error(`Selected pricing is incomplete for item "${item.title}"`);
        error.statusCode = 400;
        throw error;
      }
      subtotal += quantity * unitPrice;
    }

    order.shippingAddress = {
      addressId,
      ...address,
      selectedAt: new Date(),
    };
    order.checkout = {
      subtotal,
      total: subtotal,
      currency: "IRR",
      preparedAt: new Date(),
    };
    await order.save(session ? { session } : undefined);

    await recordEvent({
      orderId: order._id,
      type: "checkout_prepared",
      actorType: "customer",
      actorId: customerId,
      metadata: { addressId, subtotal, currency: "IRR" },
      session,
    });

    return {
      order,
      payment: {
        status: "not_started",
        amount: subtotal,
        currency: "IRR",
      },
    };
  });
}

module.exports = { prepareCheckout };
