const mongoose = require("mongoose");

const rfqSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "waiting_quotes", "quoted", "completed"],
      default: "pending",
    },

    // کل آیتم‌ها داخل array تخت
    items: [
      {
        orderItemId: mongoose.Schema.Types.ObjectId,
        part: { type: mongoose.Schema.Types.ObjectId, ref: "Part" },
        quantity: Number,

        // لیست قیمت‌های دریافتی از تأمین‌کنندگان
        quotes: [
          {
            supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
            price: Number,
            leadTimeDays: Number,
            status: {
              type: String,
              enum: ["pending", "quoted"],
              default: "pending",
            },
          },
        ],

        selectedQuote: mongoose.Schema.Types.ObjectId,
      },
    ],

    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rfq", rfqSchema);
