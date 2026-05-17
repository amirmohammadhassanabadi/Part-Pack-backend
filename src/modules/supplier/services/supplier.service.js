const supplierRepository = require("../repositories/supplier.repository");

class SupplierService {
  async createSupplier(data) {
    const existingSupplier = await supplierRepository.findByCode(data.code);

    if (existingSupplier) {
      throw new Error("Supplier with this code already exists");
    }

    return supplierRepository.create(data);
  }

  async getSuppliers({ onlyActive = true } = {}) {
    const filter = {};

    if (onlyActive) {
      filter.isActive = true;
    }

    return supplierRepository.findAll(filter);
  }

  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  async updateSupplier(id, data) {
    const supplier = await supplierRepository.updateById(id, data);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  async deleteSupplier(id) {
    const supplier = await supplierRepository.deleteById(id);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }
}

module.exports = new SupplierService();