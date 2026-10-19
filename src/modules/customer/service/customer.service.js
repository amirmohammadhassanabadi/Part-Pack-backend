const mongoose = require("mongoose");
const Customer = require("../model/customer.model");
const CarModel = require("../../vehicles/model/carModel.model");
const { createAccount, updateAccount } = require("../../accounts/service/account.service");

// --- متدهای پایه (CRUD) ---

async function createCustomer(data) {
  return createAccount("customer", data);
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
    .populate({ path: "carModels.carModelId", populate: { path: "brand", select: "name logoUrl" } })
    .populate("orders")
    .populate("invoices");

  if (!customer) {
    const error = new Error("مشتری پیدا نشد");
    error.statusCode = 404;
    throw error;
  }
  return customer;
}

async function updateCustomerStatus(id, isActive) {
  return updateAccount("customer", id, { isActive });
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
    { new: true },
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
    { new: true },
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
  return getCustomerById(customerId);
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
  return getCustomerById(customerId);
}

// Keep the existing array format; guard writes against stale browser state.
async function changeCustomerEntry(customerId, collection, entryId, data, expected) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw Object.assign(new Error("مشتری یافت نشد"), { statusCode: 404 });
  const entries = customer[collection].map((entry) => entry.toObject());
  const index = collection === "addresses"
    ? entries.findIndex((entry) => String(entry._id) === entryId)
    : Number(entryId);
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
    throw Object.assign(new Error("مورد انتخاب‌شده یافت نشد"), { statusCode: 404 });
  }
  if (collection === "carModels") {
    const current = entries[index];
    if (!expected || String(current.carModelId) !== expected.carModelId ||
        (current.year || "") !== (expected.year || "") || (current.vin || "") !== (expected.vin || "")) {
      throw Object.assign(new Error("اطلاعات گاراژ تغییر کرده است؛ صفحه را دوباره باز کنید."), { statusCode: 409 });
    }
    if (data && !await CarModel.exists({ _id: data.carModelId })) {
      throw Object.assign(new Error("مدل خودرو یافت نشد"), { statusCode: 404 });
    }
  }
  const next = [...entries];
  if (data) next[index] = { ...data, ...(collection === "addresses" ? { _id: entries[index]._id } : {}) };
  else next.splice(index, 1);
  customer.set(collection, next);
  await customer.validate();
  const updated = await Customer.updateOne(
    { _id: customer._id, [collection]: entries },
    { $set: { [collection]: customer[collection].map((entry) => entry.toObject()) }, $inc: { __v: 1 } },
    { runValidators: true },
  );
  if (!updated.matchedCount) {
    throw Object.assign(new Error("اطلاعات تغییر کرده است؛ صفحه را دوباره باز کنید."), { statusCode: 409 });
  }
  return getCustomerById(customerId);
}

module.exports = {
  changeCustomerEntry,
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  addOrderToCustomer,
  addInvoiceToCustomer,
  addAddress,
  addCarToCustomer,
};
