const mongoose = require("mongoose");

const partSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartCategory",
      required: true,
      index: true,
    },

    images: {
      type: [String],
    },

    description: {
      type: String,
      trim: true,
    },

    compatibility: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "CarModel",
      index: true,
    },

    priceStats: {
      avg: { type: Number, default: null },
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      stdDev: { type: Number, default: null },
      sampleSize: { type: Number, default: 0 },
      computedAt: { type: Date, default: null },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Part", partSchema);