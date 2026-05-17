const supplierService = require("../services/supplier.service");

class SupplierController {
  async createSupplier(req, res, next) {
    try {
      const supplier = await supplierService.createSupplier(req.body);

      res.status(201).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuppliers(req, res, next) {
    try {
      const { onlyActive } = req.query;

      const suppliers = await supplierService.getSuppliers({
        onlyActive: onlyActive !== "false",
      });

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSupplierById(req, res, next) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.getSupplierById(id);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.updateSupplier(id, req.body);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.deleteSupplier(id);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupplierController();