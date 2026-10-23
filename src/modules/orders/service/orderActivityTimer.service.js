const Invitation = require("../../invitation/model/invitation.model");

const QUOTATION_STATUSES = new Set(["supplier_invitation", "collecting_offers"]);

// Enrich only the already-authorized page, without exposing invitation or supplier data.
async function withOrderActivityTimers(orders) {
  const now = new Date();
  const bundleTimer = (order) => order.kind === "bundle" && order.status === "awaiting_payment" && order.bundleReservation?.status === "reserved"
    ? { type: "payment", expiresAt: order.bundleReservation.expiresAt } : null;
  const orderIds = orders.filter((order) => order.kind !== "bundle").map((order) => order._id);
  const activeOrderIds = orders.filter((order) => order.kind !== "bundle" && QUOTATION_STATUSES.has(order.status)).map((order) => order._id);
  if (!orderIds.length) return orders.map((order) => ({ ...order, validUntil: order.bundleReservation?.expiresAt || null, activityTimer: bundleTimer(order) }));

  const [validityDeadlines, activeDeadlines] = await Promise.all([
    Invitation.aggregate([
      { $match: { orderId: { $in: orderIds } } },
      { $group: { _id: "$orderId", expiresAt: { $max: "$token.expiresAt" } } },
    ]),
    activeOrderIds.length ? Invitation.aggregate([
      { $match: {
        orderId: { $in: activeOrderIds },
        "lifecycle.status": { $in: ["sent", "opened", "responded"] },
        "token.expiresAt": { $gt: now },
      } },
      // Quotation ends after the last active supplier invitation expires.
      { $group: { _id: "$orderId", expiresAt: { $max: "$token.expiresAt" } } },
    ]) : Promise.resolve([]),
  ]);
  const validityByOrder = new Map(validityDeadlines.map((entry) => [String(entry._id), entry.expiresAt]));
  const activeByOrder = new Map(activeDeadlines.map((entry) => [String(entry._id), entry.expiresAt]));
  return orders.map((order) => {
    const validUntil = order.bundleReservation?.expiresAt || validityByOrder.get(String(order._id)) || null;
    const expiresAt = activeByOrder.get(String(order._id));
    return {
      ...order,
      validUntil,
      activityTimer: expiresAt ? { type: "quotation", expiresAt } : bundleTimer(order),
    };
  });
}

module.exports = { withOrderActivityTimers };
