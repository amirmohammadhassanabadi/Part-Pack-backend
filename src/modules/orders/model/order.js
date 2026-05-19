const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    customerSnapshot: {
      name: String,
      phone: { Type: String, required: true },
    },

    items: [
      {
        part: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        // قیمت فروش نهایی که بعد از RFQ مشخص می‌شود
        finalUnitPrice: {
          type: Number,
        },
        selectedSupplier: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Supplier",
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "CART", // هنوز سبد خرید است
        "PENDING_RFQ", // ثبت شده، منتظر استعلام از تامین‌کننده‌ها
        "WAITING_FOR_OFFERS", // RFQ ارسال شده، منتظر پیشنهاد
        "READY_FOR_DECISION", // همه پیشنهادها آمده، اپراتور باید انتخاب کند
        "WAITING_FOR_PAYMENT", // فاکتور صادر شده، منتظر پرداخت مشتری
        "PAID", // پرداخت شده
        "CANCELLED",
      ],
      default: "CART",
      index: true,
    },

    // مجموع مبالغ برای راحتی
    totals: {
      itemsTotal: { type: Number, default: 0 },
      // اگر بعداً بخواهی:
      // discount: { ... },
      // shipping: { ... },
      grandTotal: { type: Number, default: 0 },
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
