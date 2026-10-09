const mongoose = require("mongoose");
const Payment = require("../model/payment.model");
const Order = require("../../orders/model/order.model");
const { createPaymentSession } = require("../provider/paymentProvider");

function assertObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
}

async function createSessionForOrder(orderId, customerId) {
  assertObjectId(orderId, "order ID");
  assertObjectId(customerId, "customer ID");

  const order = await Order.findOne({ _id: orderId, "customer.customerId": customerId });
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  if (order.status !== "awaiting_payment") {
    const error = new Error(`Payment cannot be started from status "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }
  if (!order.checkout?.total || order.checkout.total <= 0) {
    const error = new Error("Checkout total is not ready");
    error.statusCode = 400;
    throw error;
  }

  let payment = await Payment.findOne({ orderId: order._id });
  if (payment && ["succeeded", "pending"].includes(payment.status)) {
    if (!order.paymentId || String(order.paymentId) !== String(payment._id)) {
      order.paymentId = payment._id;
      await order.save();
    }
    return payment;
  }

  if (!payment) {
    payment = await Payment.create({ orderId: order._id, customerId, amount: order.checkout.total, currency: order.checkout.currency || "IRR" });
  } else {
    payment.amount = order.checkout.total;
    payment.currency = order.checkout.currency || "IRR";
    payment.status = "created";
    payment.failureCode = null;
    payment.failureMessage = null;
    await payment.save();
  }

  order.paymentId = payment._id;
  await order.save();
  try {
    const session = await createPaymentSession({
      paymentId: payment._id,
      orderId: order._id,
      customerId,
      amount: payment.amount,
      currency: payment.currency,
      callbackUrl: process.env.PAYMENT_CALLBACK_URL || null,
    });
    payment.provider = session.provider;
    payment.providerPaymentId = session.providerPaymentId || null;
    payment.authority = session.authority || null;
    payment.redirectUrl = session.redirectUrl;
    payment.status = "pending";
    await payment.save();
    return payment;
  } catch (error) {
    payment.status = error.code === "PAYMENT_PROVIDER_NOT_CONFIGURED" ? "not_configured" : "failed";
    payment.failureCode = error.code || "PAYMENT_SESSION_FAILED";
    payment.failureMessage = error.message;
    await payment.save();
    throw error;
  }
}

async function getCustomerPayment(paymentId, customerId) {
  assertObjectId(paymentId, "payment ID");
  assertObjectId(customerId, "customer ID");
  const payment = await Payment.findOne({ _id: paymentId, customerId }).lean();
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }
  return payment;
}

module.exports = { createSessionForOrder, getCustomerPayment };


