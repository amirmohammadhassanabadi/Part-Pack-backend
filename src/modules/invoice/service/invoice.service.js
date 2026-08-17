const mongoose = require("mongoose");
const Invoice = require("../model/invoice.model");
const Order = require("../../orders/model/order.model");
const Supplier = require("../../suppliers/model/supplier.model");

async function createInvoiceFromOrder(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId);

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

  const existingInvoice = await Invoice.findOne({ orderId });

  if (existingInvoice) {
    const error = new Error("Invoice already exists for this order");
    error.statusCode = 409;
    throw error;
  }

  // First 6 months: Part Pack is the supplier.
  const supplier = await Supplier.findOne({
    name: "Part Pack",
    isActive: true,
  });

  if (!supplier) {
    const error = new Error("Part Pack supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const availableItems = order.items.filter(
    (item) => item.availability.status === "available"
  );

  if (availableItems.length === 0) {
    const error = new Error(
      "Cannot create invoice because no items are available"
    );
    error.statusCode = 400;
    throw error;
  }

  const lines = availableItems.map((item) => {
    const lineTotal = item.qty * item.unitPrice;

    return {
      partId: item.partId,
      carModelId: item.carModelId,
      title: item.title,
      qty: item.qty,
      supplierId: supplier._id,
      supplierName: supplier.name,
      unitPrice: item.unitPrice,
      lineTotal,
    };
  });

  const total = lines.reduce(
    (sum, line) => sum + line.lineTotal,
    0
  );

  const invoice = await Invoice.create({
    orderId: order._id,

    customer: {
      customerId: order.customer.customerId,
      name: order.customer.name,
      phone: order.customer.phone,
    },

    lines,
    total,
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

async function markInvoiceAsPaid(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid invoice ID");
    error.statusCode = 400;
    throw error;
  }

  const invoice = await Invoice.findById(id);

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
  await invoice.save();

  return invoice;
}

async function cancelInvoice(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid invoice ID");
    error.statusCode = 400;
    throw error;
  }

  const invoice = await Invoice.findById(id);

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
  await invoice.save();

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