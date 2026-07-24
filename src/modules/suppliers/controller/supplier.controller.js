const supplierService = require("../controller/supplier.controller");

async function createSupplier(req, res, next) {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function getSuppliers(req, res, next) {
  try {
    const suppliers = await supplierService.getSuppliers();
    res.status(200).json(suppliers);
  } catch (error) {
    next(error);
  }
}

async function getSupplierById(req, res, next) {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const result = await supplierService.deleteSupplier(req.params.id);
    res.status(200).json({
      message: "Supplier deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function addCoverage(req, res, next) {
  try {
    const supplier = await supplierService.addCoverage(req.params.id, req.body);
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function replaceCoverage(req, res, next) {
  try {
    const supplier = await supplierService.replaceCoverage(
      req.params.id,
      req.params.brandId,
      req.body
    );
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function removeCoverage(req, res, next) {
  try {
    const supplier = await supplierService.removeCoverage(
      req.params.id,
      req.params.brandId
    );
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function getMatchingSuppliers(req, res, next) {
  try {
    const suppliers = await supplierService.findSuppliersForOrder({
      brandId: req.query.brandId,
      carModelId: req.query.carModelId,
      categoryId: req.query.categoryId,
    });

    res.status(200).json(suppliers);
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
  replaceCoverage,
  removeCoverage,
  getMatchingSuppliers,
};
