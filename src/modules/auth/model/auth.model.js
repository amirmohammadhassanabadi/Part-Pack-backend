const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["admin", "operator", "customer", "supplier"],
      required: true,
    },

    refModel: {
      type: String,
      enum: ["Admin", "Operator", "Customer", "Supplier"],
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

module.exports = mongoose.model("User", userSchema);
