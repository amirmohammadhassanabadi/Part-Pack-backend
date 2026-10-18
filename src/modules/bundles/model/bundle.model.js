const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  qty: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
}, { _id: false });

const bundleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, default: "", maxlength: 5000 },
  images: { type: [String], default: [] },
  contents: { type: [contentSchema], validate: (items) => items.length > 0 && items.length <= 50 },
  // All monetary amounts are IRR. Stock is the number of unreserved, assembled packs.
  price: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  originalPrice: { type: Number, default: null, min: 1, validate: (n) => n === null || Number.isSafeInteger(n) },
  stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  compatibilityNote: { type: String, trim: true, default: "", maxlength: 2000 },
  compatibleModelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CarModel" }],
  isActive: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
  revision: { type: Number, default: 0 },
}, { timestamps: true });
bundleSchema.index({ isActive: 1, isFeatured: 1, sortOrder: 1 });
module.exports = mongoose.model("Bundle", bundleSchema);
