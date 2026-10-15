require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const Order = require("../src/modules/orders/model/order.model");
const Invitation = require("../src/modules/invitation/model/invitation.model");
const { expireDueInvitations } = require("../src/modules/invitation/service/invitation.service");

(async () => {
  if (process.env.NODE_ENV !== "development" || !/^mongodb:\/\/(localhost|127\.0\.0\.1):27017\/partpack_local(?:\?|$)/.test(process.env.MONGO_URI || "")) throw new Error("Only the local test database is allowed");
  const orderId = process.argv[2];
  if (!mongoose.isValidObjectId(orderId)) throw new Error("Usage: npm run local:expire -- ORDER_ID");
  await mongoose.connect(process.env.MONGO_URI);
  const order = await Order.findById(orderId);
  if (!order || !["supplier_invitation", "collecting_offers"].includes(order.status)) throw new Error("Order must be collecting quotations");
  await Invitation.updateMany({ orderId }, { $set: { "token.expiresAt": new Date(Date.now() - 1000) } });
  await expireDueInvitations();
  console.log(`Order ${orderId}: ${(await Order.findById(orderId)).status}`);
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
