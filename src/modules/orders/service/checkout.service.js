const mongoose = require("mongoose");
const Order = require("../model/order.model");
const Customer = require("../../customer/model/customer.model");
const { recordEvent } = require("../../audit/service/audit.service");
const { withTransaction } = require("../../../core/database/transaction");
const { getDiscount } = require("./discount.service");
const Payment = require("../../payment/model/payment.model");
const Invoice = require("../../invoice/model/invoice.model");

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
    require("../../bundles/service/bundleOrder.service").assertReservation(order);
    const pendingPayment = await Payment.exists({ orderId, status: { $in: ["pending", "succeeded"] } }).session(session);
    if (pendingPayment) {
      const error = new Error("Checkout cannot be changed after starting payment");
      error.statusCode = 409;
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
      (item) => item.availability.status === "available" && (item.type === "bundle" || item.selectedOffer),
    );
    if (availableItems.length === 0) {
      const error = new Error("At least one selected available item is required");
      error.statusCode = 400;
      throw error;
    }

    let subtotal = 0;
    for (const item of order.items) {
      if (item.availability.status === "unavailable") continue;
      const quantity = item.type === "bundle" ? item.qty : item.selectedOffer?.selectedQuantity;
      const unitPrice = item.type === "bundle" ? item.unitPrice : item.selectedOffer?.customerUnitPrice ?? item.unitPrice;
      if (!Number.isInteger(quantity) || quantity < 1 || typeof unitPrice !== "number" || unitPrice < 0) {
        const error = new Error(`Selected pricing is incomplete for item "${item.title}"`);
        error.statusCode = 400;
        throw error;
      }
      subtotal += quantity * unitPrice;
    }

    if (!Number.isSafeInteger(subtotal)) {
      const error = new Error("Subtotal exceeds the supported amount");
      error.statusCode = 400;
      throw error;
    }

    order.shippingAddress = {
      addressId,
      ...address,
      selectedAt: new Date(),
    };
    const discount = await getDiscount(payload.discountCode, subtotal, session);
    order.checkout = {
      subtotal,
      discountCode: discount.code,
      discountAmount: discount.amount,
      total: subtotal - discount.amount,
      currency: "IRR",
      preparedAt: new Date(),
    };
    await order.save(session ? { session } : undefined);
    await Invoice.updateOne(
      { orderId, status: "pending" },
      { $set: { subtotal, discountCode: discount.code, discountAmount: discount.amount,
        total: order.checkout.total, currency: "IRR", shippingAddress: order.toObject().shippingAddress } },
      { session },
    );
    if (order.checkout.total === 0) {
      const payment = await Payment.findOneAndUpdate(
        { orderId },
        { $set: { customerId, amount: 0, currency: "IRR", status: "succeeded", paidAt: new Date(),
          provider: "unconfigured", authority: null, redirectUrl: null, failureCode: null, failureMessage: null,
          metadata: { settlement: "zero_total" } } },
        { upsert: true, returnDocument: "after", session },
      );
      await Invoice.updateOne({ orderId, status: "pending" }, { $set: { status: "paid" } }, { session });
      order.paymentId = payment._id;
      order.status = "paid";
      await recordEvent({ orderId, type: "invoice_paid", actorType: "customer", actorId: customerId,
        invoiceId: order.invoiceId, metadata: { settlement: "zero_total" }, session });
      await order.save({ session });
    }

    await recordEvent({
      orderId: order._id,
      type: "checkout_prepared",
      actorType: "customer",
      actorId: customerId,
      metadata: { addressId, subtotal, discountCode: discount.code, discountAmount: discount.amount, currency: "IRR" },
      session,
    });

    return {
      order,
      payment: {
        status: order.status === "paid" ? "succeeded" : "not_started",
        amount: order.checkout.total,
        subtotal,
        discountAmount: discount.amount,
        currency: "IRR",
      },
    };
  }, { required: true });
}

module.exports = { prepareCheckout };
