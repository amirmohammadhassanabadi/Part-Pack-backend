const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "supplier_invitation", "collecting_offers", "offers_ready", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
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

        _id: false,
      },
    ],

  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
