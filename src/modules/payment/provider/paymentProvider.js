class PaymentProviderNotConfiguredError extends Error {
  constructor() {
    super("No Iranian payment gateway has been configured yet");
    this.name = "PaymentProviderNotConfiguredError";
    this.statusCode = 503;
    this.code = "PAYMENT_PROVIDER_NOT_CONFIGURED";
  }
}

function getConfiguredProvider() {
  const providerName = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (!providerName) return null;
  throw new Error(`Payment provider "${providerName}" is not implemented`);
}

async function createPaymentSession(payload) {
  const provider = getConfiguredProvider();
  if (!provider) throw new PaymentProviderNotConfiguredError();
  return provider.createPaymentSession(payload);
}

async function verifyPayment(payload) {
  const provider = getConfiguredProvider();
  if (!provider) throw new PaymentProviderNotConfiguredError();
  return provider.verifyPayment(payload);
}

module.exports = {
  PaymentProviderNotConfiguredError,
  getConfiguredProvider,
  createPaymentSession,
  verifyPayment,
};
