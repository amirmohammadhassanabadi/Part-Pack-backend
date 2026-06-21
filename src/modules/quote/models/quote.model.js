const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    items: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },
        offers: [
          {
            supplierId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Supplier",
              required: true,
            },
            partNumber: {
              type: String,
              trim: true,
            },
            price: {
              type: Number,
              required: true,
            },
            sentAt: {
              type: Date,
              default: Date.now,
            },
            validUntil: {
              type: Date,
              default: null,
            },
            status: {
              type: String,
              enum: ["submitted", "selected", "rejected"],
              default: "submitted",
            },
            _id: false,
          },
        ],
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
