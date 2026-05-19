const Order = require("../models/order.model");

class OrderRepository {
  async create(data) {
    return await Order.create(data);
  }

  async findById(id) {
    return await Order.findById(id)
      .populate("customer")
      .populate("items.part")
      .populate("items.selectedSupplier");
  }

  async findByOrderCode(orderCode) {
    return await Order.findOne({ orderCode })
      .populate("customer")
      .populate("items.part")
      .populate("items.selectedSupplier");
  }

  async findAll(filter = {}, options = {}) {
    const { limit = 20, page = 1 } = options;

    return await Order.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async updateById(id, data) {
    return await Order.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return await Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository();
