const Bundle = require("../model/bundle.model");
const Part = require("../../parts/model/part.model");
const CarModel = require("../../vehicles/model/carModel.model");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}
function objectId(id) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) fail("شناسه نامعتبر است.");
  return id;
}
function text(value, field, max, required = false) {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) fail(`${field} نامعتبر است.`);
  return value.trim();
}
function integer(value, field, min = 0) {
  if (!Number.isSafeInteger(value) || value < min) fail(`${field} نامعتبر است.`);
  return value;
}
async function validateBundle(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) fail("اطلاعات پک نامعتبر است.");
  const allowed = ["name", "description", "images", "contents", "price", "originalPrice", "stock", "compatibilityNote", "compatibleModelIds", "isActive", "isFeatured", "sortOrder", "revision"];
  if (Object.keys(payload).some((key) => !allowed.includes(key))) fail("فیلد ناشناخته در اطلاعات پک وجود دارد.");
  const data = {
    name: text(payload.name, "نام", 200, true),
    description: text(payload.description ?? "", "توضیحات", 5000),
    price: integer(payload.price, "قیمت", 1),
    originalPrice: payload.originalPrice == null ? null : integer(payload.originalPrice, "قیمت اصلی", 1),
    stock: integer(payload.stock, "موجودی"),
    compatibilityNote: text(payload.compatibilityNote ?? "", "مشخصات سازگاری", 2000),
    sortOrder: integer(payload.sortOrder ?? 0, "ترتیب نمایش"),
  };
  if (data.originalPrice !== null && data.originalPrice < data.price) fail("قیمت اصلی نباید کمتر از قیمت فروش باشد.");
  for (const field of ["isActive", "isFeatured"]) {
    if (payload[field] !== undefined && typeof payload[field] !== "boolean") fail(`${field} نامعتبر است.`);
    data[field] = payload[field] ?? false;
  }
  const images = payload.images ?? [];
  if (!Array.isArray(images) || images.length > 10 || images.some((url) => typeof url !== "string" || url.length > 1000 || !/^\/img\/(?!.*\.\.)[^?#]+$/i.test(url))) fail("تصاویر باید از فایل‌های بارگذاری‌شده سایت باشند.");
  data.images = images;
  if (!Array.isArray(payload.contents) || !payload.contents.length || payload.contents.length > 50) fail("حداقل یک قلم برای محتویات پک وارد کنید.");
  data.contents = payload.contents.map((item) => ({
    title: text(item?.title, "نام قلم", 200, true),
    qty: integer(item?.qty, "تعداد قلم", 1),
    partId: item?.partId ? objectId(item.partId) : null,
  }));
  const ids = [...new Set(data.contents.map((item) => item.partId).filter(Boolean))];
  if (ids.length && await Part.countDocuments({ _id: { $in: ids }, isActive: true }) !== ids.length) fail("یکی از قطعات انتخاب‌شده وجود ندارد یا غیرفعال است.");
  if (!Array.isArray(payload.compatibleModelIds ?? [])) fail("مدل‌های سازگار نامعتبر است.");
  data.compatibleModelIds = [...new Set((payload.compatibleModelIds ?? []).map(objectId))];
  if (data.compatibleModelIds.length > 200) fail("تعداد مدل‌های سازگار بیش از حد مجاز است.");
  if (data.compatibleModelIds.length && await CarModel.countDocuments({ _id: { $in: data.compatibleModelIds }, isActive: true }) !== data.compatibleModelIds.length) fail("یکی از مدل‌های خودرو نامعتبر است.");
  return data;
}
async function listBundles({ admin = false, featured = false } = {}) {
  return Bundle.find({ ...(admin ? {} : { isActive: true }), ...(featured ? { isFeatured: true } : {}) })
    .sort({ sortOrder: 1, createdAt: -1 }).limit(admin ? 500 : 100).lean();
}
async function getBundle(id, { admin = false } = {}) {
  objectId(id);
  const bundle = await Bundle.findOne({ _id: id, ...(admin ? {} : { isActive: true }) }).populate("compatibleModelIds", "name").lean();
  if (!bundle) fail("پک پیدا نشد.", 404);
  return bundle;
}
async function createBundle(payload) {
  return Bundle.create(await validateBundle(payload));
}
async function updateBundle(id, payload) {
  objectId(id);
  integer(payload?.revision, "نسخه اطلاعات");
  const data = await validateBundle(payload);
  const bundle = await Bundle.findOneAndUpdate({ _id: id, revision: payload.revision }, { $set: data, $inc: { revision: 1 } }, { returnDocument: "after", runValidators: true });
  if (!bundle) fail("اطلاعات یا موجودی پک تغییر کرده؛ فهرست را دوباره دریافت کنید.", 409);
  return bundle;
}
async function deactivateBundle(id) {
  objectId(id);
  const bundle = await Bundle.findByIdAndUpdate(id, { $set: { isActive: false }, $inc: { revision: 1 } }, { returnDocument: "after" });
  if (!bundle) fail("پک پیدا نشد.", 404);
  return bundle;
}
module.exports = { listBundles, getBundle, createBundle, updateBundle, deactivateBundle, validateBundle, fail, objectId };
