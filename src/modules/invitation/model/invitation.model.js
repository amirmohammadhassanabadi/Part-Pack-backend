const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },

    partIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Part",
        required: true,
      },
    ],

    offers: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },

        availability: {
          type: String,
          enum: ["pending", "available", "unavailable"],
          default: "pending",
        },

        unitPrice: {
          type: Number,
          min: 0,
          default: null,
        },

        description: {
          type: String,
          trim: true,
          default: null,
        },

        selected: {
          type: Boolean,
          default: false,
        },

        _id: false,
      },
    ],

    token: {
      hash: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      usedAt: {
        type: Date,
        default: null,
      },
    },

    lifecycle: {
      status: {
        type: String,
        enum: ["sent", "opened", "responded", "expired"],
        default: "sent",
        index: true,
      },

      sentAt: {
        type: Date,
        default: null,
      },

      openedAt: {
        type: Date,
        default: null,
      },

      respondedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true },
);

invitationSchema.index(
  { orderId: 1, supplierId: 1 },
  { unique: true },
);

module.exports = mongoose.model("Invitation", invitationSchema);