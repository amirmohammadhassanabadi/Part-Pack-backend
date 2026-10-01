const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
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
      mobile: {
        type: String,
        required: true,
        trim: true,
      },
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
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", supplierSchema);
