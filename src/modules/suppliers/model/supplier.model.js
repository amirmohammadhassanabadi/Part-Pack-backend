const mongoose = require("mongoose");
const { identityFields } = require("../../accounts/service/profile-completion");
const { mobileField } = require("../../../core/validation/phone");

const supplierSchema = new mongoose.Schema(
  {
    ...identityFields(),
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    contacts: {
      mobile: { ...mobileField },
      landLine: {
        type: String,
        trim: true,
      },
      telegram: {
        type: String,
        trim: true,
      },
    },

    coverageRules: [
      {
        vehicleBrandId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Brand",
          required: true,
        },

        carModelIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CarModel",
            required: true,
          },
        ],

        partCategoryIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartCategory",
            required: true,
          },
        ],

        isActive: {
          type: Boolean,
          default: true,
          index: true,
        },
      },
    ],

    stats: {
      totalPartsSold: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      lastCalculatedAt: { type: Date, default: null },
    },

    balance: {
      type: Number,
      default: 0,
    },

    balanceUpdatedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", supplierSchema);
