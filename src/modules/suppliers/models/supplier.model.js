const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    phoneNumbers: {
      mobile: {
        type: String,
      },
      landLine: {
        type: String,
      },
      telegram: {
        type: String,
      },
      bale: {
        type: String,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
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
      },
    ],

    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],

    carModels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarModel",
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Supplier", supplierSchema);
