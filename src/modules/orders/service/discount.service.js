const Discount = require("../model/discount.model");

function calculateDiscount(discount, subtotal, now = new Date()) {
  if (!discount || !discount.isActive || (discount.startsAt && discount.startsAt > now) ||
      (discount.expiresAt && discount.expiresAt <= now) || subtotal < discount.minimumSubtotal) {
    const error = new Error("کد تخفیف معتبر نیست یا شرایط آن برقرار نیست.");
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 ||
      !Number.isSafeInteger(discount.minimumSubtotal ?? 0) ||
      (discount.maximumDiscount != null && (!Number.isSafeInteger(discount.maximumDiscount) || discount.maximumDiscount < 0)) ||
      (discount.type === "fixed" && !Number.isSafeInteger(discount.value)) ||
      !Number.isFinite(discount.value) || discount.value < 0 ||
      !["percent", "fixed"].includes(discount.type) || (discount.type === "percent" && discount.value > 100)) {
    const error = new Error("تنظیمات کد تخفیف معتبر نیست.");
    error.statusCode = 400;
    throw error;
  }
  const amount = discount.type === "percent" ? subtotal * discount.value / 100 : discount.value;
  return Math.min(subtotal, Math.round(amount), discount.maximumDiscount ?? subtotal);
}

async function getDiscount(code, subtotal, session, order = null) {
  if (code === undefined || code === null || code === "") return { code: null, amount: 0 };
  if (typeof code !== "string") {
    const error = new Error("discountCode must be a string");
    error.statusCode = 400;
    throw error;
  }
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { code: null, amount: 0 };
  if (normalized.length > 40) throw Object.assign(new Error("کد تخفیف بیش از حد طولانی است."), { statusCode: 400 });
  const discount = await Discount.findOne({ code: normalized }).session(session).lean();
  // Check validity/minimum against the full order, but discount only eligible lines.
  calculateDiscount(discount, subtotal);
  const restricted = discount.applicableTo && discount.applicableTo !== "all" || discount.categoryIds?.length || discount.modelIds?.length || discount.brandIds?.length;
  const eligible = restricted ? await eligibleSubtotal(discount, order, session) : subtotal;
  if (eligible <= 0) throw Object.assign(new Error("این کد برای هیچ‌کدام از اقلام سفارش قابل استفاده نیست."), { statusCode: 400 });
  return { code: normalized, amount: calculateDiscount({ ...discount, minimumSubtotal: 0 }, eligible) };
}

async function eligibleSubtotal(discount, order, session) {
  if (!order) throw Object.assign(new Error("اقلام سفارش برای بررسی تخفیف لازم است."), { statusCode: 400 });
  const Category = require("../../vehicles/model/partCategory.models");
  const CarModel = require("../../vehicles/model/carModel.model");
  const categoryIds = new Set((discount.categoryIds || []).map(String));
  if (categoryIds.size) {
    const categories = await Category.find().select("parentId").session(session).lean();
    let changed = true;
    while (changed) { changed = false; for (const category of categories) if (categoryIds.has(String(category.parentId)) && !categoryIds.has(String(category._id))) { categoryIds.add(String(category._id)); changed = true; } }
  }
  const models = discount.brandIds?.length ? await CarModel.find({ _id: { $in: order.items.map(item => item.carModelId).filter(Boolean) } }).select("brand").session(session).lean() : [];
  const brands = new Map(models.map(model => [String(model._id), String(model.brand)]));
  let total = 0;
  for (const item of order.items) {
    if (item.availability?.status !== "available") continue;
    const bundle = item.type === "bundle";
    if (discount.applicableTo === "parts" && bundle || discount.applicableTo === "bundles" && !bundle) continue;
    // Vehicle/category restrictions apply to the actual selected vehicle/part, never inferred from generic pack compatibility.
    if (categoryIds.size && !categoryIds.has(String(item.categoryId))) continue;
    if (discount.modelIds?.length && !discount.modelIds.some(id => String(id) === String(item.carModelId))) continue;
    if (discount.brandIds?.length && !discount.brandIds.some(id => String(id) === brands.get(String(item.carModelId)))) continue;
    const qty = bundle ? item.qty : item.selectedOffer?.selectedQuantity;
    const price = bundle ? item.unitPrice : item.selectedOffer?.customerUnitPrice ?? item.unitPrice;
    if (!Number.isSafeInteger(qty) || qty < 1 || !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(qty * price)) throw Object.assign(new Error("قیمت اقلام معتبر نیست."), { statusCode: 400 });
    total += qty * price;
  }
  if (!Number.isSafeInteger(total)) throw Object.assign(new Error("مبلغ تخفیف خارج از محدوده است."), { statusCode: 400 });
  return total;
}
module.exports = { calculateDiscount, getDiscount, eligibleSubtotal };
