const orderRepository = require("../repositories/order.repository");
const crypto = require("crypto");

class OrderService {
  generateOrderCode() {
    return "ORD-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  }

  calculateTotals(items) {
    let itemsTotal = 0;

    for (const item of items) {
      if (item.finalUnitPrice && item.quantity) {
        itemsTotal += item.finalUnitPrice * item.quantity;
      }
    }

    return {
      itemsTotal,
      grandTotal: itemsTotal,
    };
  }

  async createOrder(payload) {
    const orderCode = this.generateOrderCode();

    const totals = this.calculateTotals(payload.items || []);

    return await orderRepository.create({
      ...payload,
      orderCode,
      totals,
    });
  }

  async getOrderById(id) {
    return await orderRepository.findById(id);
  }

  async getOrderByCode(orderCode) {
    return await orderRepository.findByOrderCode(orderCode);
  }

  async listOrders(filter, options) {
    return await orderRepository.findAll(filter, options);
  }

  async updateOrder(id, data) {
    if (data.items) {
      data.totals = this.calculateTotals(data.items);
    }
    return await orderRepository.updateById(id, data);
  }

  async deleteOrder(id) {
    return await orderRepository.deleteById(id);
  }
}

module.exports = new OrderService();
