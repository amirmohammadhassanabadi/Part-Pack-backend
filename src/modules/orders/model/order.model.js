const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "quoting", "quoted", "confirmed", "cancelled"],
      default: "pending",
      index: true,
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
        _id: false,
      },
    ],

    invitations: [
      {
        supplierId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Supplier",
          required: true,
        },
        token: {
          type: String,
          required: true,
        },
        partIds: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: "Part",
          required: true,
        },
        status: {
          type: String,
          enum: ["sent", "opened", "responded", "expired"],
          default: "sent",
        },
        sentAt: {
          type: Date,
          default: null,
        },
        expiresAt: {
          type: Date,
          default: null,
        },
        respondedAt: {
          type: Date,
          default: null,
        },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);