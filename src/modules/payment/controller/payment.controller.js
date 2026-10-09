const paymentService = require("../service/payment.service");

async function createSession(req, res, next) {
  try {
    const payment = await paymentService.createSessionForOrder(req.params.orderId, req.user.userId);
    return res.status(201).json({ success: true, data: { paymentId: payment._id, status: payment.status, provider: payment.provider, amount: payment.amount, currency: payment.currency, redirectUrl: payment.redirectUrl } });
  } catch (error) {
    next(error);
  }
}

async function getPayment(req, res, next) {
  try {
    const payment = await paymentService.getCustomerPayment(req.params.id, req.user.userId);
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

module.exports = { createSession, getPayment };
