// const Supplier = require("../model/supplier.model");
// const Brand = require("../../vehicles/model/brand.model");
// const CarModel = require("../../vehicles/model/carModel.model");
// const PartCategory = require("../../vehicles/model/partCategory.model");

// async function createSupplier({ name, address, contacts }) {
//   const exists = await Supplier.findOne({ "contacts.mobile": contacts.mobile });
//   if (exists) throw new Error("Supplier with this mobile number already exists.");

//   const supplier = await Supplier.create({
//     name,
//     address,
//     contacts,
//   });

//   return supplier;
// }

// async function getSuppliers({ isActive, brandIds, categoryIds, page, limit } = {}) {
//   const filter = {};

//   if (isActive === true) filter.isActive = true;
//   if (brandIds && brandIds.length > 0) filter["coverage.brandId"] = { $in: brandIds };
//   if (categoryIds && categoryIds.length > 0) filter["coverage.categoryIds"] = { $in: categoryIds };

//   const parsedPage = Math.max(1, parseInt(page) || 1);
//   const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
//   const skip = (parsedPage - 1) * parsedLimit;

//   const [data, total] = await Promise.all([
//     Supplier.find(filter).skip(skip).limit(parsedLimit).sort({ name: 1 }),
//     Supplier.countDocuments(filter),
//   ]);

//   return {
//     data,
//     pagination: {
//       total,
//       page: parsedPage,
//       limit: parsedLimit,
//       totalPages: Math.ceil(total / parsedLimit),
//     },
//   };
// }

// async function getSupplierById(id) {
//   const supplier = await Supplier.findById(id);
//   if (!supplier) throw new Error("Supplier not found.");
//   return supplier;
// }

// async function updateSupplier(id, data) {
//   const allowedFields = ["name", "address", "contacts", "isActive"];
//   const receivedFields = Object.keys(data);
//   const invalidFields = receivedFields.filter((f) => !allowedFields.includes(f));

//   if (invalidFields.length > 0) throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
//   if (receivedFields.length === 0) throw new Error("No data provided for update.");

//   if (data.contacts?.mobile) {
//     const exists = await Supplier.findOne({
//       "contacts.mobile": data.contacts.mobile,
//       _id: { $ne: id },
//     });
//     if (exists) throw new Error("Supplier with this mobile number already exists.");
//   }

//   const updated = await Supplier.findByIdAndUpdate(id, data, {
//     new: true,
//     runValidators: true,
//   });
//   if (!updated) throw new Error("Supplier not found.");

//   return updated;
// }

// async function deleteSupplier(id) {
//   const deleted = await Supplier.findByIdAndUpdate(
//     id,
//     { isActive: false },
//     { new: true }
//   );
//   if (!deleted) throw new Error("Supplier not found.");
//   return deleted;
// }

// async function addCoverage(id, coverageItem) {
//   const supplier = await Supplier.findById(id);
//   if (!supplier) throw new Error("Supplier not found.");

//   const brand = await Brand.findById(coverageItem.brandId);
//   if (!brand) throw new Error("Brand not found.");
//   if (!brand.isActive) throw new Error("Brand is not active.");

//   const exists = supplier.coverage.some(
//     (c) => c.brandId.toString() === coverageItem.brandId
//   );
//   if (exists) throw new Error("Coverage for this brand already exists.");

//   if (!coverageItem.categoryIds || coverageItem.categoryIds.length === 0) {
//     throw new Error("At least one category is required.");
//   }

//   const categoryCount = await PartCategory.countDocuments({
//     _id: { $in: coverageItem.categoryIds },
//     isActive: true,
//   });
//   if (categoryCount !== coverageItem.categoryIds.length) {
//     throw new Error("One or more categories not found or inactive.");
//   }

//   if (coverageItem.allModels === false || coverageItem.allModels === undefined) {
//     if (!coverageItem.carModelIds || coverageItem.carModelIds.length === 0) {
//       throw new Error("carModelIds is required when allModels is false.");
//     }

//     const carModelCount = await CarModel.countDocuments({
//       _id: { $in: coverageItem.carModelIds },
//       brand: coverageItem.brandId,
//       isActive: true,
//     });
//     if (carModelCount !== coverageItem.carModelIds.length) {
//       throw new Error("One or more car models not found, inactive, or do not belong to this brand.");
//     }
//   }

//   const updated = await Supplier.findByIdAndUpdate(
//     id,
//     { $push: { coverage: coverageItem } },
//     { new: true, runValidators: true }
//   );

//   return updated;
// }

// async function removeCoverage(id, brandId) {
//   const updated = await Supplier.findByIdAndUpdate(
//     id,
//     { $pull: { coverage: { brandId } } },
//     { new: true }
//   );
//   if (!updated) throw new Error("Supplier not found.");
//   return updated;
// }

// async function updateCoverage(id, brandId, data) {
//   const supplier = await Supplier.findById(id);
//   if (!supplier) throw new Error("Supplier not found.");

//   const coverageIndex = supplier.coverage.findIndex(
//     (c) => c.brandId.toString() === brandId
//   );
//   if (coverageIndex === -1) throw new Error("Coverage for this brand not found.");

//   const allowedFields = ["allModels", "carModelIds", "categoryIds"];
//   const receivedFields = Object.keys(data);
//   const invalidFields = receivedFields.filter((f) => !allowedFields.includes(f));
//   if (invalidFields.length > 0) throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);

//   const updated = await Supplier.findByIdAndUpdate(
//     id,
//     {
//       $set: {
//         [`coverage.${coverageIndex}.allModels`]: data.allModels ?? supplier.coverage[coverageIndex].allModels,
//         [`coverage.${coverageIndex}.carModelIds`]: data.carModelIds ?? supplier.coverage[coverageIndex].carModelIds,
//         [`coverage.${coverageIndex}.categoryIds`]: data.categoryIds ?? supplier.coverage[coverageIndex].categoryIds,
//       },
//     },
//     { new: true, runValidators: true }
//   );

//   return updated;
// }

// module.exports = {
//   createSupplier,
//   getSuppliers,
//   getSupplierById,
//   updateSupplier,
//   deleteSupplier,
//   addCoverage,
//   removeCoverage,
//   updateCoverage,
// };
// ===========================================================================
const Supplier = require("../model/supplier.model");
const Brand = require("../../vehicles/model/brand.model");
const CarModel = require("../../vehicles/model/carModel.model");
const PartCategory = require("../../vehicles/model/partCategory.model");

/* =========================================================
   Supplier CRUD
========================================================= */

async function createSupplier({ name, address, contacts }) {
  const exists = await Supplier.findOne({
    "contacts.mobile": contacts.mobile,
  });

  if (exists) {
    throw new Error("Supplier with this mobile number already exists.");
  }

  const supplier = await Supplier.create({
    name,
    address,
    contacts,
  });

  return supplier;
}

async function getSuppliers({
  isActive,
  brandIds,
  categoryIds,
  page,
  limit,
} = {}) {
  const filter = {};

  if (isActive === true) {
    filter.isActive = true;
  }

  if (brandIds?.length) {
    filter["coverage.brandId"] = { $in: brandIds };
  }

  if (categoryIds?.length) {
    filter["coverage.categoryIds"] = { $in: categoryIds };
  }

  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

  const skip = (parsedPage - 1) * parsedLimit;

  const [data, total] = await Promise.all([
    Supplier.find(filter)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ name: 1 }),

    Supplier.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

async function getSupplierById(id) {
  const supplier = await Supplier.findById(id);

  if (!supplier) {
    throw new Error("Supplier not found.");
  }

  return supplier;
}

async function updateSupplier(id, data) {
  const allowedFields = [
    "name",
    "address",
    "contacts",
    "isActive",
  ];

  const receivedFields = Object.keys(data);

  const invalidFields = receivedFields.filter(
    (f) => !allowedFields.includes(f)
  );

  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
  }

  if (receivedFields.length === 0) {
    throw new Error("No data provided for update.");
  }

  if (data.contacts?.mobile) {
    const exists = await Supplier.findOne({
      "contacts.mobile": data.contacts.mobile,
      _id: { $ne: id },
    });

    if (exists) {
      throw new Error(
        "Supplier with this mobile number already exists."
      );
    }
  }

  const updated = await Supplier.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new Error("Supplier not found.");
  }

  return updated;
}

async function deleteSupplier(id) {
  const deleted = await Supplier.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!deleted) {
    throw new Error("Supplier not found.");
  }

  return deleted;
}

/* =========================================================
   Coverage Helpers
========================================================= */

async function validateCoverage({
  brandId,
  allModels,
  carModelIds,
  allCategory,
  categoryIds,
}) {
  const brandExists = await Brand.exists({ _id: brandId });

  if (!brandExists) {
    throw new Error("Brand not found.");
  }

  if (!allModels) {
    if (!carModelIds || carModelIds.length === 0) {
      throw new Error(
        "carModelIds is required when allModels is false."
      );
    }

    const modelsCount = await CarModel.countDocuments({
      _id: { $in: carModelIds },
    });

    if (modelsCount !== carModelIds.length) {
      throw new Error("One or more carModelIds are invalid.");
    }
  }

  if (!allCategory) {
    if (!categoryIds || categoryIds.length === 0) {
      throw new Error(
        "categoryIds is required when allCategory is false."
      );
    }

    const categoriesCount = await PartCategory.countDocuments({
      _id: { $in: categoryIds },
    });

    if (categoriesCount !== categoryIds.length) {
      throw new Error("One or more categoryIds are invalid.");
    }
  }
}

/* =========================================================
   Coverage Management
========================================================= */

async function addCoverage(supplierId, coverageData) {
  await validateCoverage(coverageData);

  const supplier = await getSupplierById(supplierId);

  supplier.coverage.push({
    brandId: coverageData.brandId,
    allModels: coverageData.allModels,
    carModelIds: coverageData.allModels
      ? []
      : coverageData.carModelIds,

    allCategory: coverageData.allCategory,
    categoryIds: coverageData.allCategory
      ? []
      : coverageData.categoryIds,
  });

  await supplier.save();

  return supplier;
}

async function removeCoverage(supplierId, coverageIndex) {
  const supplier = await getSupplierById(supplierId);

  if (
    coverageIndex < 0 ||
    coverageIndex >= supplier.coverage.length
  ) {
    throw new Error("Invalid coverage index.");
  }

  supplier.coverage.splice(coverageIndex, 1);

  await supplier.save();

  return supplier;
}

async function replaceCoverage(
  supplierId,
  coverageIndex,
  coverageData
) {
  await validateCoverage(coverageData);

  const supplier = await getSupplierById(supplierId);

  if (
    coverageIndex < 0 ||
    coverageIndex >= supplier.coverage.length
  ) {
    throw new Error("Invalid coverage index.");
  }

  supplier.coverage[coverageIndex] = {
    brandId: coverageData.brandId,

    allModels: coverageData.allModels,
    carModelIds: coverageData.allModels
      ? []
      : coverageData.carModelIds,

    allCategory: coverageData.allCategory,
    categoryIds: coverageData.allCategory
      ? []
      : coverageData.categoryIds,
  };

  await supplier.save();

  return supplier;
}

/* =========================================================
   Supplier Matching
========================================================= */

async function findSuppliersForOrder({
  brandId,
  carModelId,
  categoryId,
}) {
  const suppliers = await Supplier.find({
    isActive: true,
  });

  const matchedSuppliers = suppliers.filter((supplier) => {
    return supplier.coverage.some((coverage) => {
      const brandMatch =
        coverage.brandId.toString() === brandId.toString();

      if (!brandMatch) {
        return false;
      }

      const modelMatch =
        coverage.allModels ||
        coverage.carModelIds.some(
          (id) => id.toString() === carModelId.toString()
        );

      if (!modelMatch) {
        return false;
      }

      const categoryMatch =
        coverage.allCategory ||
        coverage.categoryIds.some(
          (id) => id.toString() === categoryId.toString()
        );

      return categoryMatch;
    });
  });

  return matchedSuppliers;
}

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,

  addCoverage,
  removeCoverage,
  replaceCoverage,

  findSuppliersForOrder,
};
