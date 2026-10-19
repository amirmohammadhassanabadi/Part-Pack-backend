const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 150, default: "" },
    applicableTo: { type: String, enum: ["all", "parts", "bundles"], default: "all" },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "PartCategory" }],
    modelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CarModel" }],
    brandIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minimumSubtotal: { type: Number, min: 0, default: 0 },
    maximumDiscount: { type: Number, min: 0, default: null },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Discount", discountSchema);
