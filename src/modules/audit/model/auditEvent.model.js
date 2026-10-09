const mongoose = require("mongoose");

const auditEventSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "order_created",
        "supplier_invitation_created",
        "invitation_opened",
        "offer_submitted",
        "offer_updated",
        "offer_deleted",
        "offers_selected",
        "offers_shortlisted",
        "checkout_prepared",
        "order_confirmed",
        "order_cancelled",
        "invoice_created",
        "invoice_cancelled",
        "invoice_paid",
      ],
      required: true,
      index: true,
    },

    actorType: {
      type: String,
      enum: ["system", "customer", "supplier", "operator", "admin"],
      required: true,
      default: "system",
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      default: null,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

auditEventSchema.index({ orderId: 1, createdAt: 1 });

module.exports = mongoose.model("AuditEvent", auditEventSchema);
