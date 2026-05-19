const orderRepository = require("../repositories/order.repository");
const crypto = require("crypto");

class OrderService {
  generateOrderCode() {
    return "ORD-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  }

  calculateTotals(items) {
    let itemsTotal = 0;

    for (const item of items) {
      if (
        typeof item.finalUnitPrice === "number" &&
        typeof item.quantity === "number"
      ) {
        itemsTotal += item.finalUnitPrice * item.quantity;
      }
    }

    return {
      itemsTotal,
      grandTotal: itemsTotal,
    };
  }

  async recalculateTotals(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    const totals = this.calculateTotals(order.items);
    order.totals = totals;

    return await order.save();
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
    const updated = await orderRepository.updateById(id, data);

    // اگر قیمت آیتم‌ها تغییر کرده بود، totals را دوباره محاسبه کن
    if (data.items) {
      return await this.recalculateTotals(id);
    }

    return updated;
  }

  async deleteOrder(id) {
    return await orderRepository.deleteById(id);
  }
}

module.exports = new OrderService();
