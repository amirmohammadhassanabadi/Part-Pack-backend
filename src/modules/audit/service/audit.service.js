const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { getAuditContext } = require("../../../core/auditContext");

const AUDIT_DIR = process.env.AUDIT_LOG_DIR || path.resolve(process.cwd(), ".audit-logs");
const RETENTION_DAYS = Math.max(1, Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 730);
let lastPrunedDay = "";
let writeQueue = Promise.resolve();

async function pruneOldFiles(today) {
  if (lastPrunedDay === today) return;
  lastPrunedDay = today;
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const files = await fs.readdir(AUDIT_DIR, { withFileTypes: true });
    await Promise.all(files.filter((file) => /^part-pack-backend-\d{4}-\d{2}-\d{2}\.jsonl$/.test(file.name))
      .map(async (file) => {
        const fullPath = path.join(AUDIT_DIR, file.name);
        const stat = await fs.stat(fullPath);
        if (stat.mtimeMs < cutoff) await fs.unlink(fullPath);
      }));
  } catch (error) {
    if (error.code !== "ENOENT") console.error(JSON.stringify({ event: "audit_log_maintenance_failed", service: "backend", code: error.code || "LOG_MAINTENANCE_FAILED" }));
  }
}

async function writeAuditLog(event) {
  const normalizedEvent = {
    schemaVersion: 1,
    service: event.service || "backend",
    eventId: event.eventId || randomUUID(),
    ...event,
  };
  const line = `${JSON.stringify(normalizedEvent)}\n`;
  console.log(line.trimEnd());
  if (!AUDIT_DIR) return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    await fs.mkdir(AUDIT_DIR, { recursive: true });
    await pruneOldFiles(today);
    const write = writeQueue.catch(() => {}).then(() => fs.appendFile(path.join(AUDIT_DIR, `part-pack-backend-${today}.jsonl`), line, { encoding: "utf8", mode: 0o600 }));
    writeQueue = write;
    await write;
  } catch (error) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", event: "audit_log_write_failed", service: "backend", code: error.code || "LOG_WRITE_FAILED" }));
  }
}

async function recordEvent({
  orderId,
  type,
  actorType = "system",
  actorId = null,
  supplierId = null,
  invitationId = null,
  invoiceId = null,
  metadata = {},
  session = null,
}) {
  if (!mongoose.isValidObjectId(orderId)) {
    return null;
  }

  const event = {
    ...getAuditContext(),
    timestamp: new Date().toISOString(),
    level: "info",
    event: "business_audit",
    orderId: String(orderId),
    type,
    actorType,
    actorId: mongoose.isValidObjectId(actorId) ? String(actorId) : null,
    supplierId: mongoose.isValidObjectId(supplierId) ? String(supplierId) : null,
    invitationId: mongoose.isValidObjectId(invitationId) ? String(invitationId) : null,
    invoiceId: mongoose.isValidObjectId(invoiceId) ? String(invoiceId) : null,
    metadata,
  };

  // Emit transaction-bound events only after the transaction commits.
  if (session) {
    session._partPaxAuditEvents ||= [];
    session._partPaxAuditEvents.push(event);
    return event;
  }

  await writeAuditLog(event);
  return event;
}

async function flushSessionEvents(session) {
  for (const event of session?._partPaxAuditEvents || []) await writeAuditLog(event);
  if (session) delete session._partPaxAuditEvents;
}

function discardSessionEvents(session) {
  if (session) delete session._partPaxAuditEvents;
}

module.exports = { recordEvent, flushSessionEvents, discardSessionEvents, writeAuditLog };
