const supplierService = require("../services/supplier.service");

class SupplierController {
  async createSupplier(req, res, next) {
    try {
      const { name, address, phoneNumbers, partTypes, brands, carModels } =
        req.body;

      const supplierDto = {
        name: name?.trim(),
        address: address?.trim(),
        phoneNumbers: {
          bale: phoneNumbers?.bale?.trim(),
          telegram: phoneNumbers?.telegram?.trim(),
          landLine: phoneNumbers?.landLine?.trim(),
        },
        partTypes: partTypes || [],
        brands: brands || [],
        carModels: carModels || [],
      };

      const supplier = await supplierService.createSupplier(supplierDto);

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
