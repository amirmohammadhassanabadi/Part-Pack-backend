const { expireDueInvitations } = require("../../modules/invitation/service/invitation.service");
const { expireBundleOrders } = require("../../modules/bundles/service/bundleOrder.service");

const EXPIRY_INTERVAL_MS = 60 * 1000;

function startInvitationExpiryJob() {
  const run = async () => {
    try {
      const result = await expireDueInvitations();
      if (result.expiredCount > 0) {
        console.log(`Expired ${result.expiredCount} supplier invitation(s)`);
      }
      await expireBundleOrders();
    } catch (error) {
      console.error("Invitation expiry job failed:", error.message);
    }
  };

  void run();
  const timer = setInterval(run, EXPIRY_INTERVAL_MS);
  timer.unref?.();
  return timer;
}

module.exports = { startInvitationExpiryJob, EXPIRY_INTERVAL_MS };
