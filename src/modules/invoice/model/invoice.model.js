const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
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

    lines: [
      {
        type: { type: String, enum: ["part", "bundle"], default: "part" },
        bundleId: { type: mongoose.Schema.Types.ObjectId, ref: "Bundle", default: null, required: function () { return this.type === "bundle"; } },
        bundleSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: function () { return this.type !== "bundle"; },
        },
        carModelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CarModel",
          default: null,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },

        availability: {
          type: String,
          enum: ["available", "unavailable"],
          required: true,
        },

        description: {
          type: String,
          trim: true,
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

        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        supplierId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Supplier",
        },
        supplierName: {
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
          required: true,
          min: 0,
        },
        lineTotal: {
          type: Number,
          required: true,
        },
        _id: false,
      },
    ],

    total: {
      type: Number,
      required: true,
    },
    subtotal: { type: Number, min: 0, default: null },
    discountCode: { type: String, default: null },
    discountAmount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "IRR" },
    shippingAddress: {
      title: String, province: String, city: String, line: String, postalCode: String,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
      index: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
