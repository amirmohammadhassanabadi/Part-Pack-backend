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

async function getDiscount(code, subtotal, session) {
  if (code === undefined || code === null || code === "") return { code: null, amount: 0 };
  if (typeof code !== "string") {
    const error = new Error("discountCode must be a string");
    error.statusCode = 400;
    throw error;
  }
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { code: null, amount: 0 };
  const discount = await Discount.findOne({ code: normalized }).session(session).lean();
  return { code: normalized, amount: calculateDiscount(discount, subtotal) };
}

module.exports = { calculateDiscount, getDiscount };
