const orderService = require("../services/order.service");

class OrderController {
  async create(req, res, next) {
    try {
      const order = await orderService.createOrder(req.body);
      return res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    } 
  }

  async getOne(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      return res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async getByCode(req, res, next) {
    try {
      const order = await orderService.getOrderByCode(req.params.code);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      return res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const { page, limit, status } = req.query;

      const filter = {};
      if (status) filter.status = status;

      const orders = await orderService.listOrders(filter, { page, limit });
      return res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const order = await orderService.updateOrder(req.params.id, req.body);
      return res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await orderService.deleteOrder(req.params.id);
      return res.json({ success: true, message: "Order deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
