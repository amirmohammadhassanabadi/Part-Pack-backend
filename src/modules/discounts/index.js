const express = require("express");
const mongoose = require("mongoose");
const Discount = require("../orders/model/discount.model");
const { authenticate, authorize } = require("../auth/middleware/auth.middleware");
const Category = require("../vehicles/model/partCategory.models");
const CarModel = require("../vehicles/model/carModel.model");
const Brand = require("../vehicles/model/brand.model");
const router = express.Router();
const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };
async function validateInput(body, previous = {}) {
  const allowed = ["name", "code", "type", "value", "minimumSubtotal", "maximumDiscount", "startsAt", "expiresAt", "isActive", "applicableTo", "categoryIds", "modelIds", "brandIds"];
  if (!body || Array.isArray(body) || typeof body !== "object" || Object.keys(body).some(key => !allowed.includes(key))) fail("فیلد نامعتبر در کد تخفیف وجود دارد.");
  const data = { minimumSubtotal: 0, maximumDiscount: null, startsAt: null, applicableTo: "all", isActive: true, categoryIds: [], modelIds: [], brandIds: [], ...previous, ...body };
  if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 150) fail("عنوان تخفیف الزامی است.");
  if (typeof data.code !== "string" || !/^[A-Z0-9_-]{3,40}$/.test(data.code.trim().toUpperCase())) fail("کد باید ۳ تا ۴۰ حرف انگلیسی، عدد، خط تیره یا زیرخط باشد.");
  data.name = data.name.trim(); data.code = data.code.trim().toUpperCase();
  if (!["percent", "fixed"].includes(data.type) || typeof data.value !== "number" || !Number.isFinite(data.value) || data.value <= 0 || data.type === "percent" && data.value > 100 || data.type === "fixed" && !Number.isSafeInteger(data.value)) fail("مقدار یا نوع تخفیف معتبر نیست.");
  if (data.minimumSubtotal === null) fail("حداقل مبلغ سفارش نامعتبر است.");
  for (const field of ["minimumSubtotal", "maximumDiscount"]) if (data[field] !== null && (!Number.isSafeInteger(data[field]) || data[field] < 0)) fail("مبالغ تخفیف باید عدد صحیح نامنفی باشند.");
  if (typeof data.isActive !== "boolean" || !["all", "parts", "bundles"].includes(data.applicableTo)) fail("وضعیت یا دامنه تخفیف نامعتبر است.");
  for (const field of ["startsAt", "expiresAt"]) {
    if (data[field] === null && field === "startsAt") continue;
    if (!data[field] || !["string", "object"].includes(typeof data[field]) || !Number.isFinite(new Date(data[field]).getTime())) fail("تاریخ اعتبار معتبر وارد کنید.");
    data[field] = new Date(data[field]);
  }
  if (data.startsAt && data.startsAt >= data.expiresAt) fail("پایان اعتبار باید بعد از شروع باشد.");
  for (const [field, Model] of [["categoryIds", Category], ["modelIds", CarModel], ["brandIds", Brand]]) {
    if (!Array.isArray(data[field]) || data[field].length > 200 || data[field].some(id => !mongoose.isValidObjectId(id))) fail("محدودیت‌های انتخاب‌شده معتبر نیستند.");
    data[field] = [...new Set(data[field].map(String))];
    if (await Model.countDocuments({ _id: { $in: data[field] }, isActive: true }) !== data[field].length) fail("یکی از گزینه‌های انتخاب‌شده موجود یا فعال نیست.");
  }
  if (data.applicableTo === "bundles" && ["categoryIds", "modelIds", "brandIds"].some(field => data[field].length)) fail("تخفیف پک مستقل از خودرو است؛ محدودیت خودرو و دسته‌بندی را پاک کنید.");
  return Object.fromEntries(allowed.map(key => [key, data[key]]));
}
router.use(authenticate, authorize("admin"));
router.get("/", async (req, res, next) => { try { res.set("Cache-Control", "no-store").json({ data: await Discount.find().sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => { try { res.status(201).json({ data: await Discount.create(await validateInput(req.body)) }); } catch (error) { next(error); } });
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "شناسه نامعتبر است." });
    const old = await Discount.findById(req.params.id).lean();
    if (!old) return res.status(404).json({ message: "کد تخفیف پیدا نشد." });
    res.json({ data: await Discount.findByIdAndUpdate(old._id, { $set: await validateInput(req.body, old) }, { returnDocument: "after", runValidators: true }) });
  } catch (error) { next(error); }
});
module.exports = router;
module.exports.validateInput = validateInput;
