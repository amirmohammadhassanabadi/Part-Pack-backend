const invoiceService = require("../service/invoice.service");

async function getInvoices(req, res, next) {
  try {
    const invoices = await invoiceService.getInvoices();

    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
}

async function getInvoiceById(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
}

async function getInvoiceByOrderId(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoiceByOrderId(
      req.params.orderId,
    );

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
}

async function markInvoiceAsPaid(req, res, next) {
  try {
    const invoice = await invoiceService.markInvoiceAsPaid(req.params.id);

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
}

async function cancelInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.cancelInvoice(req.params.id);

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