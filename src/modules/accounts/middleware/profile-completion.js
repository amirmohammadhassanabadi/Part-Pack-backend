const { requireCompleteProfile } = require("../service/profile-completion");
module.exports = async function requireCompletion(req, res, next) {
  try {
    if (["customer", "supplier"].includes(req.user?.role)) await requireCompleteProfile(req.user.role, req.user.userId);
    next();
  } catch (error) { next(error); }
};
