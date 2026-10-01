const mongoose = require("mongoose");
const Supplier = require("../model/supplier.model");
const Brand = require("../../vehicles/model/brand.model");
const CarModel = require("../../vehicles/model/carModel.model");
const Category = require("../../vehicles/model/partCategory.models");

function uniqueIds(values = []) {
  return [...new Set(values.map((value) => String(value)))];
}

async function validateCoverageRule(payload = {}) {
  const vehicleBrandId = payload.vehicleBrandId;
  const carModelIds = uniqueIds(payload.carModelIds);
  const partCategoryIds = uniqueIds(payload.partCategoryIds);

  if (!mongoose.isValidObjectId(vehicleBrandId)) {
    const error = new Error("Invalid vehicleBrandId");
    error.statusCode = 400;
    throw error;
  }

  if (carModelIds.length === 0) {
    const error = new Error("At least one carModelId is required");
    error.statusCode = 400;
    throw error;
  }

  if (partCategoryIds.length === 0) {
    const error = new Error("At least one partCategoryId is required");
    error.statusCode = 400;
    throw error;
  }

  const [brand, models, categories] = await Promise.all([
    Brand.findOne({ _id: vehicleBrandId, isActive: true }).lean(),
    CarModel.find({
      _id: { $in: carModelIds },
      brand: vehicleBrandId,
      isActive: true,
    }).select("_id"),
    Category.find({
      _id: { $in: partCategoryIds },
      isActive: true,
    }).select("_id"),
  ]);

  if (!brand) {
    const error = new Error("Active vehicle brand not found");
    error.statusCode = 404;
    throw error;
  }

  if (models.length !== carModelIds.length) {
    const error = new Error(
      "One or more car models are invalid, inactive, or do not belong to the selected vehicle brand",
    );
    error.statusCode = 400;
    throw error;
  }

  if (categories.length !== partCategoryIds.length) {
    const error = new Error(
      "One or more part categories are invalid or inactive",
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    vehicleBrandId,
    carModelIds,
    partCategoryIds,
  };
}

function coverageRuleKey(rule) {
  return [
    String(rule.vehicleBrandId),
    ...rule.carModelIds.map(String).sort(),
    "|",
    ...rule.partCategoryIds.map(String).sort(),
  ].join(":");
}

async function createSupplier(data) {
  const payload = { ...data };
  const rawRules = payload.coverageRules || [];

  if (!Array.isArray(rawRules)) {
    const error = new Error("coverageRules must be an array");
    error.statusCode = 400;
    throw error;
  }

  const normalizedRules = [];
  const keys = new Set();
  for (const rawRule of rawRules) {
    const rule = await validateCoverageRule(rawRule);
    const key = coverageRuleKey(rule);
    if (keys.has(key)) {
      const error = new Error("Duplicate coverage rule");
      error.statusCode = 409;
      throw error;
    }
    keys.add(key);
    normalizedRules.push(rule);
  }

  payload.coverageRules = normalizedRules;
  const supplier = await Supplier.create(payload);
  return supplier;
}

async function getSuppliers(filters = {}) {
  return Supplier.find(filters)
    .populate("coverageRules.vehicleBrandId", "name slug")
    .populate("coverageRules.carModelIds", "name slug brand")
    .populate("coverageRules.partCategoryIds", "name slug")
    .sort({ createdAt: -1 });
}

async function getCoverage(supplierId) {
  const supplier = await getSupplierById(supplierId);
  return supplier.coverageRules;
}
async function getSupplierById(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(id)
    .populate("coverageRules.vehicleBrandId", "name slug")
    .populate("coverageRules.carModelIds", "name slug brand")
    .populate("coverageRules.partCategoryIds", "name slug");

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

async function updateSupplier(id, data) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  if (Object.prototype.hasOwnProperty.call(data, "coverageRules")) {
    const error = new Error("Use the coverage endpoints to manage coverageRules");
    error.statusCode = 400;
    throw error;
  }
  const supplier = await Supplier.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

async function deleteSupplier(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

async function addCoverage(supplierId, payload) {
  if (!mongoose.isValidObjectId(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const rule = await validateCoverageRule(payload);
  const key = coverageRuleKey(rule);
  const duplicate = supplier.coverageRules.some(
    (existing) => existing.isActive && coverageRuleKey(existing) === key,
  );

  if (duplicate) {
    const error = new Error("This coverage rule already exists");
    error.statusCode = 409;
    throw error;
  }

  supplier.coverageRules.push(rule);
  await supplier.save();
  return supplier;
}

async function replaceCoverage(supplierId, coverageId, payload) {
  if (!mongoose.isValidObjectId(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.isValidObjectId(coverageId)) {
    const error = new Error("Invalid coverage id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const rule = supplier.coverageRules.id(coverageId);
  if (!rule) {
    const error = new Error("Coverage rule not found");
    error.statusCode = 404;
    throw error;
  }

  const normalizedRule = await validateCoverageRule(payload);
  const key = coverageRuleKey(normalizedRule);
  const duplicate = supplier.coverageRules.some(
    (existing) =>
      existing.isActive &&
      String(existing._id) !== String(coverageId) &&
      coverageRuleKey(existing) === key,
  );

  if (duplicate) {
    const error = new Error("This coverage rule already exists");
    error.statusCode = 409;
    throw error;
  }

  rule.vehicleBrandId = normalizedRule.vehicleBrandId;
  rule.carModelIds = normalizedRule.carModelIds;
  rule.partCategoryIds = normalizedRule.partCategoryIds;
  rule.isActive = true;

  await supplier.save();
  return supplier;
}

async function removeCoverage(supplierId, coverageId) {
  if (!mongoose.isValidObjectId(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.isValidObjectId(coverageId)) {
    const error = new Error("Invalid coverage id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const rule = supplier.coverageRules.id(coverageId);
  if (!rule) {
    const error = new Error("Coverage rule not found");
    error.statusCode = 404;
    throw error;
  }

  if (!rule.isActive) return supplier;

  rule.isActive = false;
  await supplier.save();
  return supplier;
}

async function findSuppliersForOrderItem({ brandId, carModelId, categoryId }) {
  if (!brandId || !carModelId || !categoryId) {
    const error = new Error("brandId, carModelId and categoryId are required");
    error.statusCode = 400;
    throw error;
  }

  if (
    !mongoose.isValidObjectId(brandId) ||
    !mongoose.isValidObjectId(carModelId) ||
    !mongoose.isValidObjectId(categoryId)
  ) {
    const error = new Error("Invalid brandId, carModelId or categoryId");
    error.statusCode = 400;
    throw error;
  }

  return Supplier.find({
    isActive: true,
    coverageRules: {
      $elemMatch: {
        vehicleBrandId: brandId,
        carModelIds: carModelId,
        partCategoryIds: categoryId,
        isActive: true,
      },
    },
  }).populate("coverageRules.vehicleBrandId", "name slug");
}

async function recordSuccessfulSale(supplierId, amount = 0) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const update = {
    $inc: {
      "stats.totalPartsSold": 1,
      "stats.totalRevenue": Number(amount) || 0,
    },
  };

  const supplier = await Supplier.findByIdAndUpdate(supplierId, update, {
    new: true,
  });

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

async function updateSupplierScore(supplierId, score) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findByIdAndUpdate(
    supplierId,
    { "stats.score": score },
    { new: true, runValidators: true },
  );

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  getCoverage,
  updateSupplier,
  deleteSupplier,
  addCoverage,
  replaceCoverage,
  removeCoverage,
  findSuppliersForOrderItem,
  recordSuccessfulSale,
  updateSupplierScore,
};
