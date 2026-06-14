const mongoose = require("mongoose");

const carModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      index: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },

    yearRange: {
      from: {type: String, required: true},
      to: {type: String, required: true},
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

carModelSchema.index({ name: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model("CarModel", carModelSchema);
