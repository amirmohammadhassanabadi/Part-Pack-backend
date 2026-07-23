const supplierService = require("../service/supplier.service");

/* =========================================================
   Supplier CRUD Controllers
========================================================= */

async function createSupplier(req, res, next) {
  try {
    const { name, address, contacts } = req.body;

    if (!name || !contacts?.mobile) {
      return res.status(400).json({
        message: "Supplier 'name' and 'contacts.mobile' are required fields.",
      });
    }

    const supplier = await supplierService.createSupplier({ name, address, contacts });
    return res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function getSuppliers(req, res, next) {
  try {
    const { isActive, brandIds, categoryIds, page, limit } = req.query;

    const parsedBrandIds = brandIds ? (Array.isArray(brandIds) ? brandIds : brandIds.split(",")) : [];
    const parsedCategoryIds = categoryIds ? (Array.isArray(categoryIds) ? categoryIds : categoryIds.split(",")) : [];
    const parsedIsActive = isActive === "true" ? true : isActive === "false" ? false : undefined;

    const result = await supplierService.getSuppliers({
      isActive: parsedIsActive,
      brandIds: parsedBrandIds,
      categoryIds: parsedCategoryIds,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    return res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await supplierService.updateSupplier(id, updateData);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await supplierService.deleteSupplier(id);
    return res.status(200).json(deleted);
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   Coverage Management Controllers
========================================================= */

async function addCoverage(req, res, next) {
  try {
    const { id } = req.params;
    const { brandId, allModels, carModelIds, allCategory, categoryIds } = req.body;

    const updatedSupplier = await supplierService.addCoverage(id, {
      brandId,
      allModels,
      carModelIds,
      allCategory,
      categoryIds,
    });

    return res.status(200).json(updatedSupplier);
  } catch (error) {
    next(error);
  }
}

async function removeCoverage(req, res, next) {
  try {
    const { id } = req.params;
    const { coverageIndex } = req.body;

    if (coverageIndex === undefined || coverageIndex === null) {
      return res.status(400).json({
        message: "coverageIndex parameter is required to remove coverage rule.",
      });
    }

    const updatedSupplier = await supplierService.removeCoverage(id, parseInt(coverageIndex, 10));
    return res.status(200).json(updatedSupplier);
  } catch (error) {
    next(error);
  }
}

async function replaceCoverage(req, res, next) {
  try {
    const { id } = req.params;
    const { coverageIndex, coverageData } = req.body;

    if (coverageIndex === undefined || coverageIndex === null || !coverageData) {
      return res.status(400).json({
        message: "Both coverageIndex and coverageData are required fields.",
      });
    }

    const updatedSupplier = await supplierService.replaceCoverage(
      id,
      parseInt(coverageIndex, 10),
      coverageData
    );

    return res.status(200).json(updatedSupplier);
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   Operator Discovery Controller
========================================================= */

async function findMatchingSuppliers(req, res, next) {
  try {
    const { brandId, carModelId, categoryId } = req.query;

    if (!brandId || !carModelId || !categoryId) {
      return res.status(400).json({
        message: "Query parameters brandId, carModelId, and categoryId are required.",
      });
    }

    const matchingSuppliers = await supplierService.findSuppliersForOrder({
      brandId,
      carModelId,
      categoryId,
    });

    return res.status(200).json(matchingSuppliers);
  } catch (error) {
    next(error);
  }
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
  findMatchingSuppliers,
};
