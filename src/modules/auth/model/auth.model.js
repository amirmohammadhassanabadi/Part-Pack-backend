const mongoose = require("mongoose");
const { mobileField } = require("../../../core/validation/phone");

const authSchema = new mongoose.Schema(
  {
    phone: {
      ...mobileField,
      unique: true,
    },

    role: {
      type: String,
      enum: ["admin", "operator", "customer", "supplier"],
      required: true,
    },

    refModel: {
      type: String,
      required: true,
      enum: ["Staff", "Customer", "Supplier"],
      validate: {
        validator(value) {
          return value === ({ customer: "Customer", supplier: "Supplier", admin: "Staff", operator: "Staff" })[this.get("role")];
        },
        message: "نوع پروفایل با نقش حساب هماهنگ نیست.",
      },
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "refModel",
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

module.exports = mongoose.model("Auth", authSchema);
