const mongoose = require("mongoose");

const orderOfferSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    itemKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

    source: {
      type: String,
      enum: ["supplier", "operator"],
      required: true,
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

    invitationOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

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

    description: {
      type: String,
      trim: true,
      default: null,
    },

    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    selectedQuantity: {
      type: Number,
      min: 1,
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

    status: {
      type: String,
      enum: ["submitted", "shortlisted", "selected", "rejected"],
      default: "submitted",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    shortlistedAt: {
      type: Date,
      default: null,
    },

    shortlistedBy: {
      type: mongoose.Schema.Types.ObjectId,
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
  { timestamps: true },
);

orderOfferSchema.index({ orderId: 1, itemKey: 1, status: 1 });
orderOfferSchema.index({ orderId: 1, source: 1 });

module.exports = mongoose.model("OrderOffer", orderOfferSchema);
