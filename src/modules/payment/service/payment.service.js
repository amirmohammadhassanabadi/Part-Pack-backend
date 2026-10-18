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
  const { withTransaction } = require("../../../core/database/transaction");
  const { assertReservation } = require("../../bundles/service/bundleOrder.service");
  const isBundle = await Order.exists({ _id: orderId, "customer.customerId": customerId, kind: "bundle" });
  const prepared = await withTransaction(async (dbSession) => {
    const order = await Order.findOne({ _id: orderId, "customer.customerId": customerId }).session(dbSession);
    if (!order) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
    if (order.status !== "awaiting_payment") throw Object.assign(new Error(`Payment cannot be started from status "${order.status}"`), { statusCode: 400 });
    if (!order.checkout?.total || order.checkout.total <= 0) throw Object.assign(new Error("Checkout total is not ready"), { statusCode: 400 });
    if (isBundle && !await require("../../invoice/model/invoice.model").exists({ _id: order.invoiceId, status: "pending" }).session(dbSession)) throw Object.assign(new Error("فاکتور قابل پرداخت نیست."), { statusCode: 409 });
    let payment = await Payment.findOne({ orderId: order._id }).session(dbSession);
    if (payment && ["succeeded", "pending"].includes(payment.status)) {
      if (String(order.paymentId) !== String(payment._id)) {
        order.paymentId = payment._id;
        await order.save({ session: dbSession });
      }
      return { order, payment, reuse: true };
    }
    if (isBundle && payment?.status === "created") throw Object.assign(new Error("درخواست پرداخت در حال پردازش است؛ کمی صبر کنید."), { statusCode: 409 });
    assertReservation(order);
    if (!payment) {
      [payment] = await Payment.create([{ orderId: order._id, customerId, amount: order.checkout.total, currency: order.checkout.currency || "IRR" }], { session: dbSession });
    } else {
      payment.amount = order.checkout.total;
      payment.currency = order.checkout.currency || "IRR";
      payment.status = "created";
      payment.failureCode = null;
      payment.failureMessage = null;
      await payment.save({ session: dbSession });
    }
    order.paymentId = payment._id;
    // Write the order as well as the payment, so expiry and payment start cannot race.
    if (isBundle) order.markModified("bundleReservation");
    await order.save({ session: dbSession });
    return { order, payment, reuse: false };
  }, { required: Boolean(isBundle) });
  const { order, payment } = prepared;
  if (prepared.reuse) return payment;
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
