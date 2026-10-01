const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    availability: {
      type: String,
      enum: ["available", "unavailable"],
      required: true,
    },

    brandName: {
      type: String,
      trim: true,
      required: function () {
        return this.availability === "available";
      },
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

    availableQuantity: {
      type: Number,
      min: 0,
      default: 0,
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

    selectedAt: {
      type: Date,
      default: null,
    },

    selectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const invitationItemSchema = new mongoose.Schema(
  {
    itemKey: {
      type: String,
      required: true,
    },

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

    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    offers: {
      type: [offerSchema],
      default: [],
    },
  },
  { _id: false },
);

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

    items: {
      type: [invitationItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "An invitation must contain at least one order item",
      },
    },

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