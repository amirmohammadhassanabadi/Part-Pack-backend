const Invitation = require("../../invitation/model/invitation.model");

const QUOTATION_STATUSES = new Set(["supplier_invitation", "collecting_offers"]);

// Enrich only the already-authorized page, without exposing invitation or supplier data.
async function withOrderActivityTimers(orders) {
  const orderIds = orders.filter((order) => QUOTATION_STATUSES.has(order.status)).map((order) => order._id);
  if (!orderIds.length) return orders.map((order) => ({ ...order, activityTimer: null }));

  const deadlines = await Invitation.aggregate([
    { $match: {
      orderId: { $in: orderIds },
      "lifecycle.status": { $in: ["sent", "opened", "responded"] },
      "token.expiresAt": { $gt: new Date() },
    } },
    // Quotation ends after the last active supplier invitation expires.
    { $group: { _id: "$orderId", expiresAt: { $max: "$token.expiresAt" } } },
  ]);
  const deadlineByOrder = new Map(deadlines.map((entry) => [String(entry._id), entry.expiresAt]));
  return orders.map((order) => {
    const expiresAt = deadlineByOrder.get(String(order._id));
    return {
      ...order,
      activityTimer: expiresAt ? { type: "quotation", expiresAt } : null,
    };
  });
}

module.exports = { withOrderActivityTimers };
