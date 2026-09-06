const mongoose = require("mongoose");

const partCategorySchema = new mongoose.Schema(
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

    logoUrl: {
      type: String,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartCategory",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PartCategory", partCategorySchema);
