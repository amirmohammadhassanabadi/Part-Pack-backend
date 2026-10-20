const jwt = require("jsonwebtoken");
const Auth = require("../model/auth.model");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Pre-tracking tokens must refresh once so each browser gets a revocable session ID.
    if (decoded.refModel && !decoded.sid) return res.status(401).json({ success: false, message: "نشست باید تمدید شود." });
    if (decoded.sid) await require("../service/session.service").assertSession(decoded.sid, decoded);
    {
      const account = await Auth.findOne({ refId: decoded.userId, role: decoded.role }).select("isActive sessionVersion").lean();
      if (!account || !account.isActive || (account.sessionVersion || 0) !== (decoded.sessionVersion || 0)) {
        return res.status(401).json({ success: false, code: "ACCOUNT_DISABLED", message: "حساب غیرفعال شده یا نشست آن پایان یافته است." });
      }
    }
    if (["admin", "operator"].includes(decoded.role)) {
      const staff = await require("../../staff/model/staff.model").findById(decoded.userId).lean();
      if (!staff?.isActive || staff.role !== decoded.role) return res.status(401).json({ success: false, message: "نشست پرسنل پایان یافته است." });
      decoded.permissions = require("../../staff/permissions").staffPermissions(staff);
    }
    req.user = decoded;

    next();
  } catch (error) {
    if (error.statusCode === 401) return res.status(401).json({ success: false, message: error.message });
    if (!["JsonWebTokenError", "TokenExpiredError", "NotBeforeError", "CastError"].includes(error.name)) return next(error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role) || (req.user.role === "operator" && !require("../../staff/permissions").operatorCanAccess(req))) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
}

/**
 * Make sure a customer can only access
 * his own customer resource.
 *
 * Admin and operator are allowed to access
 * any customer.
 *
 * Expected route:
 * /customers/:id
 */
function authorizeCustomerOwnership(req, res, next) {
  if (req.user.role === "admin" || req.user.role === "operator") {
    return next();
  }

  if (req.user.role === "customer") {
    if (String(req.user.userId) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
}

module.exports = {
  authenticate,
  authorize,
  authorizeCustomerOwnership,
};
