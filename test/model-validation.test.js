const test = require("node:test");
const assert = require("node:assert/strict");

const Order = require("../src/modules/orders/model/order.model");
const Invoice = require("../src/modules/invoice/model/invoice.model");
const AuditEvent = require("../src/modules/audit/model/auditEvent.model");

const ids = {
  customer: "665f1c8e2f8c1b0011111111",
  part: "665f1c8e2f8c1b0012345678",
  model: "665f1c8e2f8c1b0098765432",
  category: "665f1c8e2f8c1b0055555555",
  supplier: "665f1c8e2f8c1b001234abce",
  invitation: "665f1c8e2f8c1b001234abcd",
  offer: "665f1c8e2f8c1b001234abcf",
  invoice: "665f1c8e2f8c1b001234abd0",
};

test("order accepts a selected supplier offer", () => {
  const order = new Order({
    customer: { customerId: ids.customer, name: "Test", phone: "0912" },
    items: [{
      partId: ids.part,
      carModelId: ids.model,
      categoryId: ids.category,
      title: "Brake pad",
      qty: 2,
      availability: { status: "available" },
      unitPrice: 100,
      selectedOffer: {
        invitationId: ids.invitation,
        supplierId: ids.supplier,
        offerId: ids.offer,
        brandName: "Bosch",
        unitPrice: 100,
        selectedQuantity: 1,
      },
    }],
  });
  assert.equal(order.validateSync(), undefined);
});

test("invoice accepts unavailable lines", () => {
  const invoice = new Invoice({
    orderId: ids.invoice,
    customer: { customerId: ids.customer, name: "Test", phone: "0912" },
    lines: [{
      partId: ids.part,
      carModelId: ids.model,
      title: "Filter",
      availability: "unavailable",
      description: "No supplier offer",
      qty: 1,
      unitPrice: 0,
      lineTotal: 0,
    }],
    total: 0,
  });
  assert.equal(invoice.validateSync(), undefined);
});

test("audit event rejects unknown event types", () => {
  const event = new AuditEvent({ orderId: ids.invoice, type: "unknown" });
  assert.match(event.validateSync().errors.type.message, /enum/);
});
