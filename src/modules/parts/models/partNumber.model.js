const mongoose = require("mongoose");

const partNumberSchema = new mongoose.Schema(
  {
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["OEM", "Aftermarket"],
      required: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PartNumber", partNumberSchema);