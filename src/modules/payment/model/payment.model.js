const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["unconfigured", "zarinpal", "idpay", "nextpay", "other"],
      default: "unconfigured",
      index: true,
    },
    providerPaymentId: { type: String, trim: true, default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: "IRR" },
    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "succeeded",
        "failed",
        "cancelled",
        "not_configured",
      ],
      default: "created",
      index: true,
    },
    authority: { type: String, trim: true, default: null },
    redirectUrl: { type: String, trim: true, default: null },
    failureCode: { type: String, trim: true, default: null },
    failureMessage: { type: String, trim: true, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
