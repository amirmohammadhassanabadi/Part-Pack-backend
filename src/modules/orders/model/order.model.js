const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "supplier_invitation",
        "collecting_offers",
        "operator_review",
        "customer_selection",
        "awaiting_payment",
        "paid",
        "completed",
        "payment_failed",
        "expired",
        "offers_ready",
        "confirmed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
      index: true,
    },

    shippingAddress: {
      addressId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      title: { type: String, trim: true, default: null },
      province: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      line: { type: String, trim: true, default: null },
      postalCode: { type: String, trim: true, default: null },
      selectedAt: { type: Date, default: null },
    },

    checkout: {
      subtotal: { type: Number, min: 0, default: null },
      total: { type: Number, min: 0, default: null },
      currency: { type: String, trim: true, default: "IRR" },
      preparedAt: { type: Date, default: null },
    },

    cancellation: {
      reason: {
        type: String,
        trim: true,
        default: null,
      },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      cancelledAt: {
        type: Date,
        default: null,
      },
    },

    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    items: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },

        carModelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CarModel",
          required: true,
        },

        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PartCategory",
          required: true,
        },

        title: {
          type: String,
          required: true,
          trim: true,
        },

        qty: {
          type: Number,
          required: true,
          min: 1,
        },

        availability: {
          status: {
            type: String,
            enum: ["pending", "available", "unavailable"],
            default: "pending",
          },

          description: {
            type: String,
            trim: true,
            default: null,
          },
        },

        unitPrice: {
          type: Number,
          min: 0,
          default: null,
        },

        selectedOffer: {
          invitationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invitation",
            default: null,
          },

          orderOfferId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrderOffer",
            default: null,
          },

          supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            default: null,
          },

          offerId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },

          brandName: {
            type: String,
            trim: true,
            default: null,
          },

          manufacturerName: {
            type: String,
            trim: true,
            default: null,
          },

          partNumber: {
            type: String,
            trim: true,
            default: null,
          },

          unitPrice: {
            type: Number,
            min: 0,
            default: null,
          },

          baseUnitPrice: {
            type: Number,
            min: 0,
            default: null,
          },

          markupPercent: {
            type: Number,
            min: 1,
            max: 100,
            default: null,
          },

          markupAmount: {
            type: Number,
            min: 0,
            default: null,
          },

          customerUnitPrice: {
            type: Number,
            min: 0,
            default: null,
          },

          source: {
            type: String,
            enum: ["supplier", "operator"],
            default: null,
          },

          selectedQuantity: {
            type: Number,
            min: 1,
            default: null,
          },

          selectedAt: {
            type: Date,
            default: null,
          },

          selectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },
        },

        _id: false,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
