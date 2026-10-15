require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const Auth = require("../src/modules/auth/model/auth.model");
const Staff = require("../src/modules/staff/model/staff.model");
const Customer = require("../src/modules/customer/model/customer.model");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const Brand = require("../src/modules/vehicles/model/brand.model");
const CarModel = require("../src/modules/vehicles/model/carModel.model");
const Category = require("../src/modules/vehicles/model/partCategory.models");
const Part = require("../src/modules/parts/model/part.model");
const Discount = require("../src/modules/orders/model/discount.model");
const local = path.resolve(__dirname, "../.local");
const manifestPath = path.join(local, "demo-data.json");

function assertLocal() {
  const uri = process.env.MONGO_URI || "";
  if (process.env.NODE_ENV !== "development" || !/^mongodb:\/\/(localhost|127\.0\.0\.1):27017\/partpack_local(?:\?|$)/.test(uri)) {
    throw new Error("Seed is allowed only for the local partpack_local development database");
  }
}
async function upsert(Model, filter, fields) {
  return Model.findOneAndUpdate(filter, { $set: fields }, { upsert: true, returnDocument: "after", runValidators: true });
}
async function identity(phone, role, refModel, reference) {
  await upsert(Auth, { phone }, { phone, role, refModel, refId: reference._id, isActive: true });
}
async function main() {
  assertLocal();
  await mongoose.connect(process.env.MONGO_URI);
  fs.mkdirSync(local, { recursive: true });
  const admin = await upsert(Staff, { phone: "09128498876" }, { fullName: "مدیر تست پارت‌پک", phone: "09128498876", role: "admin", isActive: true });
  const operator = await upsert(Staff, { phone: "09128498880" }, { fullName: "اپراتور تست تأمین و فروش", phone: "09128498880", role: "operator", isActive: true });
  await identity(admin.phone, "admin", "Staff", admin);
  await identity(operator.phone, "operator", "Staff", operator);
  let customer = await Customer.findOne({ phone: "09128498877" });
  if (!customer) customer = await Customer.create({
    phone: "09128498877", fullName: "مشتری تست پارت‌پک", addresses: [
      { title: "خانه", province: "تهران", city: "تهران", line: "خیابان تست، کوچه نمونه، پلاک ۱۰", postalCode: "1234567890" },
      { title: "محل کار", province: "البرز", city: "کرج", line: "بلوار نمونه، ساختمان تست، طبقه ۲", postalCode: "1234567891" },
    ],
  });
  await identity(customer.phone, "customer", "Customer", customer);
  const brands = [];
  const models = [];
  for (const [name, slug, modelNames] of [
    ["چری", "chery", [["تیگو ۷", "tiggo-7"], ["آریزو ۵", "arrizo-5"]]],
    ["جک", "jac", [["جک S5", "jac-s5"]]],
    ["ام‌وی‌ام", "mvm", [["ام‌وی‌ام X22", "mvm-x22"]]],
  ]) {
    const brand = await upsert(Brand, { slug: `local-${slug}` }, { name: `${name} (تست)`, slug: `local-${slug}`, country: "چین", isActive: true });
    brands.push(brand);
    for (const [modelName, modelSlug] of modelNames) models.push(await upsert(CarModel, { slug: `local-${modelSlug}` }, {
      name: `${modelName} (تست)`, slug: `local-${modelSlug}`, brand: brand._id, yearRange: { from: "2018", to: "2026" }, isActive: true,
    }));
  }
  const categories = [];
  const subcategories = [];
  for (const [name, slug, children] of [
    ["سیستم ترمز", "brakes", [["لنت ترمز", "pads"], ["دیسک ترمز", "discs"]]],
    ["موتور و مصرفی", "engine", [["فیلترها", "filters"], ["شمع و احتراق", "ignition"]]],
    ["تعلیق و جلوبندی", "suspension", [["کمک‌فنر", "shocks"], ["سیبک و طبق", "arms"]]],
  ]) {
    const parent = await upsert(Category, { slug: `local-${slug}` }, { name, slug: `local-${slug}`, parentId: null, isActive: true });
    categories.push(parent);
    for (const [childName, childSlug] of children) subcategories.push(await upsert(Category, { slug: `local-${childSlug}` }, { name: childName, slug: `local-${childSlug}`, parentId: parent._id, isActive: true }));
  }
  const titles = ["لنت ترمز جلو", "دیسک ترمز جلو", "فیلتر روغن", "شمع موتور", "کمک‌فنر جلو", "طبق جلو", "لنت ترمز عقب", "دیسک ترمز عقب", "فیلتر هوا", "کوئل موتور", "کمک‌فنر عقب", "سیبک فرمان"];
  const parts = [];
  for (const [index, title] of titles.entries()) {
    const model = models[index % models.length];
    const name = `${title} ${model.name}`;
    parts.push(await upsert(Part, { name }, { name, categoryId: subcategories[index % 6]._id,
      compatibility: [model._id], images: [], description: "قطعه نمونه برای تست محلی؛ قیمت قطعی پس از استعلام تعیین می‌شود.", isActive: true }));
  }
  const coverageRules = brands.map((brand) => ({ vehicleBrandId: brand._id,
    carModelIds: models.filter((model) => String(model.brand) === String(brand._id)).map((model) => model._id),
    partCategoryIds: subcategories.map((category) => category._id), isActive: true }));
  const suppliers = [];
  for (const [mobile, name] of [["09128498878", "تأمین‌کننده تست اول"], ["09128498879", "تأمین‌کننده تست دوم"]]) {
    const supplier = await upsert(Supplier, { "contacts.mobile": mobile }, { name, "contacts.mobile": mobile, address: "تهران، انبار تست", coverageRules, isActive: true });
    suppliers.push(supplier);
    await identity(mobile, "supplier", "Supplier", supplier);
  }
  await upsert(Discount, { code: "TEST20" }, { code: "TEST20", type: "percent", value: 20, minimumSubtotal: 0, maximumDiscount: 5000000, isActive: true });
  await upsert(Discount, { code: "TEST100" }, { code: "TEST100", type: "percent", value: 100, minimumSubtotal: 0, maximumDiscount: null, isActive: true });
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { orders: [] };
  manifest.accounts = [
    { phone: admin.phone, role: "admin" }, { phone: operator.phone, role: "operator" },
    { phone: customer.phone, role: "customer" }, ...suppliers.map((supplier) => ({ phone: supplier.contacts.mobile, role: "supplier" })),
  ];
  const lines = ["# حساب‌های تست محلی", "", ...manifest.accounts.map((account) => `- ${account.role}: ${account.phone} — OTP: 112233`), "", "سفارش و فاکتور نمونه ساخته نمی‌شود؛ سفارش را از حساب مشتری ثبت کنید."];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });
  fs.writeFileSync(path.join(local, "demo-links.md"), lines.join("\n"), { mode: 0o600 });
  console.log(`Seed ready: ${brands.length} brands, ${models.length} models, ${categories.length} categories, ${subcategories.length} subcategories, ${parts.length} parts, ${suppliers.length} suppliers; no orders/invoices created.`);
  console.log("Accounts and order/invitation links: .local/demo-links.md");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
