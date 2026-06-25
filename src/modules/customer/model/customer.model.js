const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["customer"],
      default: "customer",
    },

    addresses: [
      {
        title: { type: String, required: true, trim: true },
        province: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        line: { type: String, required: true, trim: true },
        postalCode: { type: String, trim: true },
        _id: false,
      },
    ],

    carModels: [
      {
        carModelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CarModel",
          required: true,
        },
        year: { type: String, trim: true },
        vin: { type: String, trim: true },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Customer", customerSchema);
