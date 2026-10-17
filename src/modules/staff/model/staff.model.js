const mongoose = require("mongoose");
const { mobileField } = require("../../../core/validation/phone");

const staffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      ...mobileField,
      unique: true,
    },

    role: {
      type: String,
      enum: ["admin", "operator"],
      required: true,
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

module.exports = mongoose.model("Staff", staffSchema);
