const Bundle = require("../model/bundle.model");
const Order = require("../../orders/model/order.model");
const Invoice = require("../../invoice/model/invoice.model");
const Customer = require("../../customer/model/customer.model");
const Payment = require("../../payment/model/payment.model");
const { withTransaction } = require("../../../core/database/transaction");
const { recordEvent } = require("../../audit/service/audit.service");
const { fail, objectId } = require("./bundle.service");
const RESERVATION_MS = 30 * 60 * 1000;

function validateItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) fail("اقلام پک نامعتبر است.");
  const seen = new Set();
  for (const item of items) {
    if (!item || item.partId || (item.type && item.type !== "bundle")) fail("پک‌ها و قطعات استعلامی را در دو سفارش جدا ثبت کنید.");
    objectId(item.bundleId);
    if (seen.has(item.bundleId)) fail("پک تکراری در سفارش وجود دارد.");
    seen.add(item.bundleId);
    if (!Number.isSafeInteger(item.qty) || item.qty < 1) fail("تعداد پک نامعتبر است.");
    if (item.carModelId) fail("انتخاب خودرو برای خرید پک ارسال نشود؛ سازگاری در مشخصات پک درج شده است.");
  }
}

async function createBundleOrder(customerId, items) {
  objectId(customerId);
  validateItems(items);
  return withTransaction(async (session) => {
    const customer = await Customer.findOne({ _id: customerId, isActive: true }).session(session);
    if (!customer) fail("حساب مشتری پیدا نشد.", 404);
    const orderItems = [];
    let total = 0;
    for (const item of items) {
      const bundle = await Bundle.findOneAndUpdate(
        { _id: item.bundleId, isActive: true, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty, revision: 1 } },
        { session, returnDocument: "after" },
      );
      if (!bundle) fail("یکی از پک‌ها غیرفعال شده یا موجودی کافی ندارد؛ سبد را بررسی کنید.", 409);
      const snapshot = {
        name: bundle.name, image: bundle.images[0] || "", description: bundle.description,
        contents: bundle.contents.toObject(), compatibilityNote: bundle.compatibilityNote,
        compatibleModelIds: bundle.compatibleModelIds, originalPrice: bundle.originalPrice,
      };
      total += bundle.price * item.qty;
      orderItems.push({ type: "bundle", bundleId: bundle._id, title: bundle.name, qty: item.qty,
        unitPrice: bundle.price, availability: { status: "available" }, bundleSnapshot: snapshot });
    }
    if (!Number.isSafeInteger(total)) fail("مبلغ سفارش بیش از حد مجاز است.");
    const expiresAt = new Date(Date.now() + RESERVATION_MS);
    const [order] = await Order.create([{
      kind: "bundle", status: "awaiting_payment", items: orderItems,
      customer: { customerId: customer._id, name: customer.fullName, phone: customer.phone },
      bundleReservation: { status: "reserved", expiresAt },
    }], { session });
    const [invoice] = await Invoice.create([{
      orderId: order._id, customer: order.customer, subtotal: total, total, currency: "IRR", expiresAt,
      lines: orderItems.map((item) => ({ ...item, availability: "available", lineTotal: item.unitPrice * item.qty })),
    }], { session });
    order.invoiceId = invoice._id;
    await order.save({ session });
    await Customer.updateOne({ _id: customerId }, { $addToSet: { invoices: invoice._id, orders: order._id } }, { session });
    await recordEvent({ orderId: order._id, type: "order_created", actorType: "customer", actorId: customerId, metadata: { kind: "bundle", total }, session });
    await recordEvent({ orderId: order._id, type: "invoice_created", invoiceId: invoice._id, metadata: { total, kind: "bundle" }, session });
    return order;
  }, { required: true });
}

function assertReservation(order) {
  if (order.kind !== "bundle") return;
  if (order.bundleReservation?.status !== "reserved" || !order.bundleReservation.expiresAt || order.bundleReservation.expiresAt <= new Date()) fail("مهلت رزرو پک تمام شده؛ سفارش جدیدی ثبت کنید.", 409);
}

// Must run in the same transaction as the order cancellation. Repeated calls do not restock twice.
async function releaseReservation(order, session) {
  if (order.kind !== "bundle" || order.bundleReservation?.status !== "reserved") return;
  if (!session) fail("آزادسازی موجودی نیاز به تراکنش دارد.", 503);
  for (const item of order.items) {
    await Bundle.updateOne({ _id: item.bundleId }, { $inc: { stock: item.qty, revision: 1 } }, { session });
  }
  order.bundleReservation.status = "released";
}

async function expireBundleOrders() {
  const activePayments = await Payment.distinct("orderId", { status: { $in: ["created", "pending", "succeeded"] } });
  const due = await Order.find({ _id: { $nin: activePayments }, kind: "bundle", status: "awaiting_payment", "bundleReservation.status": "reserved", "bundleReservation.expiresAt": { $lte: new Date() } }).select("_id").limit(100).lean();
  for (const candidate of due) {
    await withTransaction(async (session) => {
      const order = await Order.findOne({ _id: candidate._id, status: "awaiting_payment", "bundleReservation.status": "reserved", "bundleReservation.expiresAt": { $lte: new Date() } }).session(session);
      if (!order) return;
      if (await Invoice.exists({ _id: order.invoiceId, status: "paid" }).session(session)) return;
      // A gateway may still report success for an in-flight payment. Keep its stock reserved.
      if (await Payment.exists({ orderId: order._id, status: { $in: ["created", "pending", "succeeded"] } }).session(session)) return;
      await releaseReservation(order, session);
      order.status = "expired";
      await order.save({ session });
      await Invoice.updateOne({ _id: order.invoiceId, status: "pending" }, { $set: { status: "cancelled" } }, { session });
      await recordEvent({ orderId: order._id, type: "order_cancelled", metadata: { reason: "bundle_reservation_expired" }, session });
    }, { required: true });
  }
}

module.exports = { createBundleOrder, validateItems, assertReservation, releaseReservation, expireBundleOrders, RESERVATION_MS };
