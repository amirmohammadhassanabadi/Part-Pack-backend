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

    coverage: [
      {
        brandId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Brand",
          required: true,
        },
        allModels: {
          type: Boolean,
          default: false,
        },
        carModelIds: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: "CarModel",
          default: [],
        },
        allCategory: {
          type: Boolean,
          default: false,
        },
        categoryIds: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: "PartCategory",
          required: true,
        },
        _id: false,
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
