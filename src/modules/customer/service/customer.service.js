const mongoose = require("mongoose");
const Customer = require("../model/customer.model");
const CarModel = require("../../vehicles/model/carModel.model");

// --- متدهای پایه (CRUD) ---

async function createCustomer(data) {
  const existing = await Customer.findOne({ phone: data.phone });
  if (existing) {
    const error = new Error("مشتری با این شماره موبایل قبلاً ثبت شده است.");
    error.statusCode = 409;
    throw error;
  }
  return await Customer.create(data);
}

async function getAllCustomers(filters = {}) {
  // اضافه کردن پاپولیت برای دیدن آخرین سفارش‌ها در صورت نیاز
  return await Customer.find(filters)
    .populate("carModels.carModelId", "name brand")
    .select("-orders -invoices"); // برای لیست کلی معمولاً این دو فیلد سنگین را برنمی‌گردانیم
}

async function getCustomerById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("شناسه مشتری نامعتبر است");
    error.statusCode = 400;
    throw error;
  }
  const customer = await Customer.findById(id)
    .populate("carModels.carModelId")
    .populate("orders")
    .populate("invoices");

  if (!customer) {
    const error = new Error("مشتری پیدا نشد");
    error.statusCode = 404;
    throw error;
  }
  return customer;
}

// --- مدیریت فیلدهای Ref (Orders & Invoices) ---

/**
 * اضافه کردن یک سفارش به لیست مشتری
 * این متد معمولاً توسط Order Service صدا زده می‌شود
 */
async function addOrderToCustomer(customerId, orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("شناسه سفارش نامعتبر است");
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $addToSet: { orders: orderId } }, // $addToSet از ثبت تکراری جلوگیری می‌کند
    { new: true }
  );

  if (!customer) throw new Error("مشتری یافت نشد");
  return customer;
}

/**
 * اضافه کردن یک فاکتور به لیست مشتری
 * این متد معمولاً توسط Invoice Service صدا زده می‌شود
 */
async function addInvoiceToCustomer(customerId, invoiceId) {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    throw new Error("شناسه فاکتور نامعتبر است");
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $addToSet: { invoices: invoiceId } },
    { new: true }
  );

  if (!customer) throw new Error("مشتری یافت نشد");
  return customer;
}

// --- مدیریت آدرس‌ها و خودروها (همان قبلی) ---

async function addAddress(customerId, addressData) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("مشتری یافت نشد");
  
  customer.addresses.push(addressData);
  await customer.save();
  return customer;
}

async function addCarToCustomer(customerId, carData) {
  const modelExists = await CarModel.exists({ _id: carData.carModelId });
  if (!modelExists) {
    const error = new Error("مدل خودرو یافت نشد");
    error.statusCode = 404;
    throw error;
  }

  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("مشتری یافت نشد");

  customer.carModels.push(carData);
  await customer.save();
  return customer;
}

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  addOrderToCustomer,
  addInvoiceToCustomer,
  addAddress,
  addCarToCustomer
};
