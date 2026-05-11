const mongoose = require("mongoose");

const partSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["موتوری", "بدنه", "برقی", "جلوبندی", "مصرفی"],
      required: true,
    },

    partNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    normalizedPartNumber: {
      type: String,
      index: true,
    },

    oemNumbers: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],

    category: {
      type: String,
      index: true,
    },

    subCategory: {
      type: String,
      index: true,
    },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    images: [String],

    compatibleCarModels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarModel",
        index: true,
      },
    ],

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },

    manufacturerCountry: String,

    qualityType: {
      type: String,
      enum: ["شرکتی", "وارداتی", "افترمارکت", "استوک"],
      default: "افترمارکت",
    },

    tags: [{ type: String }],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    description: String,

    specifications: {
      weight: Number,
      dimensions: String,
      material: String,
    },
  },
  {
    timestamps: true,
  },
);

partSchema.pre("save", function (next) {
  if (this.isModified("partNumber")) {
    this.normalizedPartNumber = this.partNumber
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }
  next();
});

// جستجوی پارت نامبر و OEM
partSchema.index({ partNumber: 1, oemNumbers: 1 });

// text search
partSchema.index(
  {
    name: "text",
    tags: "text",
    description: "text",
  },
  {
    weights: {
      name: 10,
      tags: 5,
      description: 1,
    },
  },
);

module.exports = mongoose.model("Part", partSchema);
