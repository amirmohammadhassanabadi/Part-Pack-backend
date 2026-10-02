const mongoose = require("mongoose");
const Invoice = require("../model/invoice.model");
const Order = require("../../orders/model/order.model");
const Supplier = require("../../suppliers/model/supplier.model");
const { recordEvent } = require("../../audit/service/audit.service");

async function createInvoiceFromOrder(orderId, { session = null } = {}) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const orderQuery = Order.findById(orderId);
  if (session) orderQuery.session(session);
  const order = await orderQuery;

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.status !== "confirmed") {
    const error = new Error(
      `Invoice can only be created for a confirmed order`
    );
    error.statusCode = 400;
    throw error;
  }

  const existingInvoiceQuery = Invoice.findOne({ orderId });
  if (session) existingInvoiceQuery.session(session);
  const existingInvoice = await existingInvoiceQuery;

  if (existingInvoice) {
    const error = new Error("Invoice already exists for this order");
    error.statusCode = 409;
    throw error;
  }

  const availableItems = order.items.filter(
    (item) => item.availability.status === "available",
  );

  if (availableItems.length === 0) {
    const error = new Error(
      "Cannot create invoice because no items are available"
    );
    error.statusCode = 400;
    throw error;
  }

  const selectedSupplierIds = availableItems
    .map((item) => item.selectedOffer?.supplierId)
    .filter(Boolean);

  const suppliersQuery = Supplier.find({
    _id: { $in: selectedSupplierIds },
  })
    .select("name")
    .lean();
  if (session) suppliersQuery.session(session);
  const suppliers = await suppliersQuery;

  const supplierNames = new Map(
    suppliers.map((supplier) => [String(supplier._id), supplier.name]),
  );

  const lines = order.items.map((item) => {
    const isAvailable = item.availability.status === "available";
    const selectedOffer = item.selectedOffer;

    if (isAvailable && !selectedOffer) {
      const error = new Error(
        `Available item "${item.title}" has no selected supplier offer`,
      );
      error.statusCode = 400;
      throw error;
    }

    if (!isAvailable && (!item.availability.description || !item.availability.description.trim())) {
      const error = new Error(
        `Unavailable item "${item.title}" has no description`,
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      isAvailable &&
      (!Number.isInteger(selectedOffer.selectedQuantity) ||
        selectedOffer.selectedQuantity < 1 ||
        selectedOffer.selectedQuantity > item.qty ||
        typeof selectedOffer.unitPrice !== "number" ||
        !Number.isFinite(selectedOffer.unitPrice) ||
        selectedOffer.unitPrice < 0)
    ) {
      const error = new Error(
        `Selected offer for item "${item.title}" has invalid quantity or price`,
      );
      error.statusCode = 400;
      throw error;
    }

    const qty = isAvailable ? selectedOffer.selectedQuantity : item.qty;
    const unitPrice = isAvailable ? selectedOffer.unitPrice : 0;
    const lineTotal = isAvailable ? qty * unitPrice : 0;
    const supplierId = isAvailable ? selectedOffer.supplierId : null;

    return {
      partId: item.partId,
      carModelId: item.carModelId,
      title: item.title,
      availability: isAvailable ? "available" : "unavailable",
      description: item.availability.description || null,
      brandName: isAvailable ? selectedOffer.brandName : null,
      manufacturerName: isAvailable ? selectedOffer.manufacturerName : null,
      qty,
      supplierId,
      supplierName: supplierId
        ? supplierNames.get(String(supplierId)) || null
        : null,
      partNumber: isAvailable ? selectedOffer.partNumber : null,
      unitPrice,
      lineTotal,
    };
  });

  const total = lines.reduce(
    (sum, line) => sum + line.lineTotal,
    0
  );

  const invoicePayload = {
    orderId: order._id,

    customer: {
      customerId: order.customer.customerId,
      name: order.customer.name,
      phone: order.customer.phone,
    },

    lines,
    total,
  };
  const [invoice] = session
    ? await Invoice.create([invoicePayload], { session })
    : [await Invoice.create(invoicePayload)];

  try {
    order.invoiceId = invoice._id;
    await order.save(session ? { session } : undefined);
  } catch (error) {
    if (!session) await Invoice.deleteOne({ _id: invoice._id });
    throw error;
  }

  await recordEvent({
    orderId: order._id,
    type: "invoice_created",
    invoiceId: invoice._id,
    metadata: {
      total: invoice.total,
      lineCount: invoice.lines.length,
    },
    session,
  });

  return invoice;
}

async function getInvoices() {
  return Invoice.find()
    .populate("orderId")
    .populate("customer.customerId", "name phone")
    .populate("lines.partId", "name")
    .populate("lines.carModelId", "name")
    .populate("lines.supplierId", "name")
    .sort({ createdAt: -1 });
}

async function getInvoiceById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid invoice ID");
    error.statusCode = 400;
    throw error;
  }

  const invoice = await Invoice.findById(id)
    .populate("orderId")
    .populate("customer.customerId", "name phone")
    .populate("lines.partId", "name")
    .populate("lines.carModelId", "name")
    .populate("lines.supplierId", "name");

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  return invoice;
}

async function getInvoiceByOrderId(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const invoice = await Invoice.findOne({ orderId })
    .populate("orderId")
    .populate("customer.customerId", "name phone")
    .populate("lines.partId", "name")
    .populate("lines.carModelId", "name")
    .populate("lines.supplierId", "name");

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  return invoice;
}

async function markInvoiceAsPaid(id, actorId = null, { session = null } = {}) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid invoice ID");
    error.statusCode = 400;
    throw error;
  }

  const invoiceQuery = Invoice.findById(id);
  if (session) invoiceQuery.session(session);
  const invoice = await invoiceQuery;

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  if (invoice.status !== "pending") {
    const error = new Error(
      `Invoice cannot be paid from status "${invoice.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  invoice.status = "paid";
  await invoice.save(session ? { session } : undefined);

  await recordEvent({
    orderId: invoice.orderId,
    type: "invoice_paid",
    actorType: mongoose.isValidObjectId(actorId) ? "operator" : "system",
    actorId,
    invoiceId: invoice._id,
    session,
  });

  return invoice;
}

async function cancelInvoice(id, actorId = null, { session = null } = {}) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid invoice ID");
    error.statusCode = 400;
    throw error;
  }

  const invoiceQuery = Invoice.findById(id);
  if (session) invoiceQuery.session(session);
  const invoice = await invoiceQuery;

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  if (invoice.status !== "pending") {
    const error = new Error(
      `Invoice cannot be cancelled from status "${invoice.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  invoice.status = "cancelled";
  await invoice.save(session ? { session } : undefined);

  await recordEvent({
    orderId: invoice.orderId,
    type: "invoice_cancelled",
    actorType: mongoose.isValidObjectId(actorId) ? "operator" : "system",
    actorId,
    invoiceId: invoice._id,
    session,
  });

  return invoice;
}

module.exports = {
  createInvoiceFromOrder,
  getInvoices,
  getInvoiceById,
  getInvoiceByOrderId,
  markInvoiceAsPaid,
  cancelInvoice,
};
