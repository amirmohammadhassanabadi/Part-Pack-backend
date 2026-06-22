const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "operator", "customer", "supplier"],
      required: true,
    },

    refModel: {
      type: String,
      enum: ["Staff", "Customer", "Supplier"],
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "refModel",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Auth", authSchema);
