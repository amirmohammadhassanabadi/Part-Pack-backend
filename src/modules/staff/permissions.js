const SCOPES = ["sales", "supply"];
// Legacy operators retain their existing access until an admin explicitly sets it.
function staffPermissions(staff) {
  if (staff?.role === "admin") return [...SCOPES];
  return Array.isArray(staff?.permissions) ? staff.permissions.filter(value => SCOPES.includes(value)) : [...SCOPES];
}
function validatePermissions(value) {
  if (!Array.isArray(value) || value.some(item => !SCOPES.includes(item)) || new Set(value).size !== value.length) {
    throw Object.assign(new Error("دسترسی پرسنل باید شامل فروش و/یا تأمین باشد."), { statusCode: 400 });
  }
  return value;
}
// Called after authenticate and before the route's role checks. Unknown staff APIs fail closed.
function operatorCanAccess(req) {
  const path = req.originalUrl.split("?")[0].replace(/^\/api\/v1/, "");
  const scopes = req.user.permissions || [];
  const sales = scopes.includes("sales"), supply = scopes.includes("supply");
  if (/^\/auth\/sessions(?:\/|$)/.test(path)) return true;
  if (/^\/staff\/[^/]+$/.test(path) && req.method === "GET") return String(req.params.id) === String(req.user.userId);
  if (/^\/customers(?:\/|$)/.test(path)) return sales;
  if (/^\/suppliers(?:\/|$)/.test(path)) return supply;
  if (/^\/(parts|vehicles)(?:\/|$)/.test(path)) return supply;
  if (/^\/users(?:\/|$)/.test(path)) return sales || supply; // Specific kind checked again by the users router.
  if (/^\/invoices(?:\/|$)/.test(path)) return sales;
  if (/^\/orders(?:\/|$)/.test(path)) {
    if (req.method === "GET") {
      if (/\/invitations$/.test(path)) return supply;
      return sales || supply;
    }
    if (/\/offers$/.test(path)) return sales;
    return sales;
  }
  return false;
}
module.exports = { SCOPES, staffPermissions, validatePermissions, operatorCanAccess };
