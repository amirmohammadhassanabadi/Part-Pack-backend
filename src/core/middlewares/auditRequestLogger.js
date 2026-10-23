const SECRET_FIELD = /token|password|secret|otp|code|cookie|authorization/i;
const ID = /^[a-f\d]{24}$/i;
const CORRELATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const { randomUUID } = require("crypto");
const { writeAuditLog } = require("../../modules/audit/service/audit.service");
const { runWithAuditContext } = require("../auditContext");
const AUDIT_VALUE_FIELDS = new Set(["status", "role", "isActive", "active", "qty", "quantity", "amount", "total", "subtotal", "unitPrice", "price", "currency", "discountAmount", "itemCount", "count", "otpWay", "kind", "source"]);

function safeRoute(path) {
  return path.split("/").map((part) => {
    if (ID.test(part)) return ":id";
    if (part.length >= 32 && /^[a-f\d]+$/i.test(part)) return ":token";
    return part;
  }).join("/");
}

module.exports = function auditRequestLogger(req, res, next) {
  if (!req.path.startsWith("/api/v1/")) return next();
  const candidate = req.get("x-correlation-id");
  const correlationId = CORRELATION_ID.test(candidate || "") ? candidate : randomUUID();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  const started = Date.now();
  res.on("finish", () => {
    const status = res.statusCode;
    const actor = req.user || req.account || {};
    const bodyFields = Object.keys(req.body || {}).filter((key) => !SECRET_FIELD.test(key));
    const safeValues = Object.fromEntries(Object.entries(req.body || {})
      .filter(([key, value]) => AUDIT_VALUE_FIELDS.has(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"))
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 100) : value]));
    const targetIds = req.path.split("/").filter((part) => ID.test(part));
    const isAuthentication = req.path.startsWith("/api/v1/auth/");
    const eventType = isAuthentication
      ? "authentication_attempt"
      : status === 401 || status === 403 || status === 429
      ? "access_denied"
      : req.method === "GET" || req.method === "HEAD"
        ? "api_read_completed"
        : "api_action_completed";
    const actorId = actor.userId || actor._id || actor.id || null;
    void writeAuditLog({
      timestamp: new Date().toISOString(), level: status >= 400 ? "warn" : "info",
      event: "application_audit", type: eventType, correlationId,
      method: req.method, route: safeRoute(req.path), status,
      outcome: status < 400 ? "success" : "failure", durationMs: Date.now() - started,
      failureCode: status >= 400 ? req.auditErrorCode || "HTTP_REQUEST_FAILED" : null,
      actorId: ID.test(String(actorId || "")) ? String(actorId) : null,
      actorRole: actor.role || null, actorSource: actorId ? "verified_access_token" : "anonymous",
      sessionId: actor.sid || null, bodyFields, safeValues, targetIds,
      ...(isAuthentication && typeof req.body?.phone === "string"
        ? { phoneLast4: req.body.phone.replace(/\D/g, "").slice(-4) }
        : {}),
    });
  });
  runWithAuditContext({ correlationId }, next);
};
