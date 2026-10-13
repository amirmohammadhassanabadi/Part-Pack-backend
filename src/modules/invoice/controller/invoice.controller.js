const invoiceService = require("../service/invoice.service");

function customerInvoiceView(invoice) {
  const value = invoice.toObject ? invoice.toObject() : invoice;
  value.orderId = value.orderId?._id || value.orderId;
  value.lines = value.lines.map(({ supplierId, supplierName, ...line }) => line);
  return value;
}

function ownedInvoice(invoice, req) {
  if (req.user.role !== "customer") return invoice;
  const customerId = invoice.customer.customerId?._id || invoice.customer.customerId;
  if (String(customerId) !== String(req.user.userId)) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }
  return customerInvoiceView(invoice);
}

async function getInvoices(req, res, next) {
  try {
    const invoices = await invoiceService.getInvoices(req.user.role === "customer" ? req.user.userId : null);

    res.status(200).json(invoices.map((invoice) => ownedInvoice(invoice, req)));
  } catch (error) {
    next(error);
  }
}

async function getInvoiceById(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    res.status(200).json(ownedInvoice(invoice, req));
  } catch (error) {
    next(error);
  }
}

async function getInvoiceByOrderId(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoiceByOrderId(
      req.params.orderId,
    );

    res.status(200).json(ownedInvoice(invoice, req));
  } catch (error) {
    next(error);
  }
}

async function markInvoiceAsPaid(req, res, next) {
  try {
    const invoice = await invoiceService.markInvoiceAsPaid(
      req.params.id,
      req.user.userId,
    );

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
}

async function cancelInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.cancelInvoice(
      req.params.id,
      req.user.userId,
    );

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  getInvoiceByOrderId,
  markInvoiceAsPaid,
  cancelInvoice,
};
