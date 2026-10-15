require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const Order = require("../src/modules/orders/model/order.model");
const OrderOffer = require("../src/modules/orders/model/orderOffer.model");
const Invitation = require("../src/modules/invitation/model/invitation.model");
const Invoice = require("../src/modules/invoice/model/invoice.model");
const Payment = require("../src/modules/payment/model/payment.model");
const AuditEvent = require("../src/modules/audit/model/auditEvent.model");
const Customer = require("../src/modules/customer/model/customer.model");
const local = path.resolve(__dirname, "../.local");

(async () => {
  if (process.env.NODE_ENV !== "development" || !/^mongodb:\/\/(localhost|127\.0\.0\.1):27017\/partpack_local(?:\?|$)/.test(process.env.MONGO_URI || "")) throw new Error("Only the local partpack_local database is allowed");
  await mongoose.connect(process.env.MONGO_URI);
  const [orders, invoices, invitations, offers, payments, audits] = await Promise.all([
    Order.countDocuments(), Invoice.countDocuments(), Invitation.countDocuments(), OrderOffer.countDocuments(), Payment.countDocuments(), AuditEvent.countDocuments(),
  ]);
  const orderIds = (await Order.find({}, { _id: 1 }).lean()).map((entry) => entry._id);
  await Promise.all([
    Order.deleteMany({}), Invoice.deleteMany({}), Invitation.deleteMany({}), OrderOffer.deleteMany({}), Payment.deleteMany({}), AuditEvent.deleteMany({}),
    Customer.updateMany({}, { $set: { orders: [], invoices: [] } }),
  ]);
  fs.writeFileSync(path.join(local, "demo-data.json"), JSON.stringify({ orders: [], accounts: [] }, null, 2), { mode: 0o600 });
  fs.writeFileSync(path.join(local, "demo-links.md"), "# داده‌های تست محلی\n\nفعلاً سفارش نمونه‌ای وجود ندارد. از حساب مشتری وارد شوید و سبد جدید بسازید.\n", { mode: 0o600 });
  console.log(`Removed local sample data: ${orders} orders, ${invoices} invoices, ${invitations} invitations, ${offers} offers, ${payments} payments, ${audits} audit events.`);
  console.log(`Removed order references: ${orderIds.length}`);
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
