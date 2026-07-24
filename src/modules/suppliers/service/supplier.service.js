const mongoose = require("mongoose");
const Supplier = require("../model/supplier.model");
const Brand = require("../../vehicles/model/brand.model");
const CarModel = require("../../vehicles/model/carModel.model");
const Category = require("../../vehicles/model/partCategory.models");

async function validateCoverageReferences({
  brandId,
  allModels,
  carModelIds = [],
  allCategory,
  categoryIds = [],
}) {
  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    const error = new Error("Invalid brandId");
    error.statusCode = 400;
    throw error;
  }

  const brandExists = await Brand.exists({ _id: brandId });
  if (!brandExists) {
    const error = new Error("Brand not found");
    error.statusCode = 404;
    throw error;
  }

  if (!allModels) {
    if (!Array.isArray(carModelIds) || carModelIds.length === 0) {
      const error = new Error(
        "carModelIds is required when allModels is false"
      );
      error.statusCode = 400;
      throw error;
    }

    for (const id of carModelIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`Invalid carModelId: ${id}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const foundModelsCount = await CarModel.countDocuments({
      _id: { $in: carModelIds },
      brand: brandId,
    });

    if (foundModelsCount !== carModelIds.length) {
      const error = new Error(
        "One or more carModelIds are invalid or do not belong to the selected brand"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (!allCategory) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      const error = new Error(
        "categoryIds is required when allCategory is false"
      );
      error.statusCode = 400;
      throw error;
    }

    for (const id of categoryIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`Invalid categoryId: ${id}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const foundCategoriesCount = await Category.countDocuments({
      _id: { $in: categoryIds },
    });

    if (foundCategoriesCount !== categoryIds.length) {
      const error = new Error("One or more categoryIds are invalid");
      error.statusCode = 400;
      throw error;
    }
  }
}

function normalizeCoverageInput(payload) {
  return {
    brandId: payload.brandId,
    allModels: Boolean(payload.allModels),
    carModelIds: payload.allModels ? [] : payload.carModelIds || [],
    allCategory: Boolean(payload.allCategory),
    categoryIds: payload.allCategory ? [] : payload.categoryIds || [],
  };
}

async function createSupplier(data) {
  const supplier = await Supplier.create(data);
  return supplier;
}

async function getSuppliers(filters = {}) {
  const suppliers = await Supplier.find(filters)
    .populate("user", "name email phone")
    .populate("coverage.brandId", "name")
    .populate("coverage.carModelIds", "name")
    .populate("coverage.categoryIds", "name");

  return suppliers;
}

async function getSupplierById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(id)
    .populate("user", "name email phone")
    .populate("coverage.brandId", "name")
    .populate("coverage.carModelIds", "name")
    .populate("coverage.categoryIds", "name");

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

async function updateSupplier(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid supplier id");
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findByIdAndDelete(id);

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  return supplier;
}

async function addCoverage(supplierId, payload) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const coverageInput = normalizeCoverageInput(payload);

  await validateCoverageReferences(coverageInput);

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const alreadyExists = supplier.coverage.some(
    (item) => item.brandId.toString() === coverageInput.brandId.toString()
  );

  if (alreadyExists) {
    const error = new Error("Coverage for this brand already exists");
    error.statusCode = 409;
    throw error;
  }

  supplier.coverage.push(coverageInput);
  await supplier.save();

  return supplier;
}

async function replaceCoverage(supplierId, brandId, payload) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    const error = new Error("Invalid brandId");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const coverageIndex = supplier.coverage.findIndex(
    (item) => item.brandId.toString() === brandId.toString()
  );

  if (coverageIndex === -1) {
    const error = new Error("Coverage for this brand not found");
    error.statusCode = 404;
    throw error;
  }

  const coverageInput = normalizeCoverageInput({
    ...payload,
    brandId,
  });

  await validateCoverageReferences(coverageInput);

  supplier.coverage[coverageIndex] = coverageInput;
  await supplier.save();

  return supplier;
}

async function removeCoverage(supplierId, brandId) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    const error = new Error("Invalid brandId");
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error("Supplier not found");
    error.statusCode = 404;
    throw error;
  }

  const initialLength = supplier.coverage.length;

  supplier.coverage = supplier.coverage.filter(
    (item) => item.brandId.toString() !== brandId.toString()
  );

  if (supplier.coverage.length === initialLength) {
    const error = new Error("Coverage for this brand not found");
    error.statusCode = 404;
    throw error;
  }

  await supplier.save();

  return supplier;
}

async function findSuppliersForOrder({ brandId, carModelId, categoryId }) {
  if (!brandId || !carModelId || !categoryId) {
    const error = new Error(
      "brandId, carModelId and categoryId are required"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    !mongoose.Types.ObjectId.isValid(brandId) ||
    !mongoose.Types.ObjectId.isValid(carModelId) ||
    !mongoose.Types.ObjectId.isValid(categoryId)
  ) {
    const error = new Error("Invalid brandId, carModelId or categoryId");
    error.statusCode = 400;
    throw error;
  }

  const suppliers = await Supplier.find({
    isActive: true,
    coverage: {
      $elemMatch: {
        brandId,
        $and: [
          {
            $or: [{ allModels: true }, { carModelIds: carModelId }],
          },
          {
            $or: [{ allCategory: true }, { categoryIds: categoryId }],
          },
        ],
      },
    },
  })
    .populate("user", "name email phone")
    .populate("coverage.brandId", "name");

  return suppliers;
}

async function recordSuccessfulSale(supplierId, amount = 0) {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Invalid supplier id");
    error.statusCode = 400;
    throw error;
  }

  const update = {
    $inc: {
      totalSalesCount: 1,
      totalRevenue: Number(amount) || 0,
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
    { score },
    { new: true, runValidators: true }
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
  updateSupplier,
  deleteSupplier,
  addCoverage,
  replaceCoverage,
  removeCoverage,
  findSuppliersForOrder,
  recordSuccessfulSale,
  updateSupplierScore,
};
