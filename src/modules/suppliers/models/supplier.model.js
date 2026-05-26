const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    phoneNumbers: {
      bale: {
        type: String,
        index: true,
      },
      telegram: {
        type: String,
        index: true,
      },
      landLine: {
        type: String,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    partTypes: [
      {
        type: String,
        enum: [
          "engine",
          "body",
          "electric",
          "consumable",
          "suspension",
          "other",
        ],
        index: true,
      },
    ],

    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        index: true,
      },
    ],

    carModels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarModel",
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// برای پیدا کردن سریع تامین‌کننده مناسب
supplierSchema.index({ partTypes: 1, brands: 1, carModels: 1 });

module.exports = mongoose.model("Supplier", supplierSchema);
