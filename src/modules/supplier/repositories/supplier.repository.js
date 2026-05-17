const Supplier = require("../models/supplier.model");

class SupplierRepository {
  async create(data) {
    return Supplier.create(data);
  }

  async findAll(filter = {}) {
    return Supplier.find(filter);
  }

  async findById(id) {
    return Supplier.findById(id);
  }

  async findByCode(code) {
    return Supplier.findOne({ code });
  }

  async updateById(id, data) {
    return Supplier.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return Supplier.findByIdAndDelete(id);
  }
}

module.exports = new SupplierRepository();