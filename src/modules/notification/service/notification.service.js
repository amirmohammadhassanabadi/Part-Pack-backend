function buildSupplierInvitationUrl(token) {
  const baseUrl =
    process.env.SUPPLIER_PORTAL_URL ||
    "http://localhost:3000/supplier/invitations";
  return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(token)}`;
}

async function sendSupplierInvitation({
  orderId,
  supplierId,
  token,
  expiresAt,
}) {
  const url = buildSupplierInvitationUrl(token);
  if (process.env.NODE_ENV === "development" && process.env.DEV_AUTH_ENABLED === "true") {
    console.log(`[local invitation] ${supplierId}: ${url}`);
  }

  return {
    provider: "noop",
    status: "queued",
    orderId,
    supplierId,
    url,
    expiresAt,
  };
}

module.exports = { buildSupplierInvitationUrl, sendSupplierInvitation };
