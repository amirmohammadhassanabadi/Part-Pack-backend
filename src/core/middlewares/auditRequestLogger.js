const AREAS = new Set(["auth", "users", "staff", "suppliers", "customers", "vehicles", "parts", "bundles", "discounts", "settings"]);
const SECRET_FIELD = /token|password|secret|otp|code|cookie|authorization/i;
const ID = /^[a-f\d]{24}$/i;

function safeRoute(path) {
  return path.split("/").map((part) => {
    if (ID.test(part)) return ":id";
    if (part.length >= 32 && /^[a-f\d]+$/i.test(part)) return ":token";
    return part;
  }).join("/");
}

module.exports = function auditRequestLogger(req, res, next) {
  const parts = req.path.split("/").filter(Boolean);
  const area = parts[2];
  if (!parts[0] || parts[0] !== "api" || parts[1] !== "v1" || !AREAS.has(area)) return next();
  const auth = area === "auth";
  const action = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!auth && !action && ![401, 403, 429].includes(res.statusCode)) return next();
  const started = Date.now();
  res.on("finish", () => {
    const status = res.statusCode;
    if (!auth && !action && ![401, 403, 429].includes(status)) return;
    const actor = req.user || req.account || {};
    const bodyFields = Object.keys(req.body || {}).filter((key) => !SECRET_FIELD.test(key));
    const event = {
      timestamp: new Date().toISOString(), level: status >= 400 ? "warn" : "info",
      event: "application_audit", type: auth ? "authentication_attempt" : status === 401 || status === 403 || status === 429 ? "access_denied" : "account_or_admin_action",
      method: req.method, route: safeRoute(req.path), status, outcome: status < 400 ? "success" : "failure",
      durationMs: Date.now() - started, actorId: ID.test(String(actor._id || actor.id || "")) ? String(actor._id || actor.id) : null,
      actorRole: actor.role || null, bodyFields,
    };
    if (auth && typeof req.body?.phone === "string") event.phoneLast4 = req.body.phone.replace(/\D/g, "").slice(-4);
    console.log(JSON.stringify(event));
  });
  next();
};
