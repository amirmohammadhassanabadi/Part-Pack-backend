const Supplier = require("../models/supplier.model");

class SupplierRepository {
  /**
   * پیدا کردن یک مورد بر اساس فیلترهای ارسالی
   * @param {Object} filter
   */

  async findOne(filter) {
    return await Supplier.findOne(filter).lean();
  }

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

  async findLastOne() {
    // پیدا کردن آخرین رکورد بر اساس زمان ساخت و بازگرداندن فقط فیلد code
    return await Supplier.findOne({}, { code: 1 })
      .sort({ createdAt: -1 })
      .lean();
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
