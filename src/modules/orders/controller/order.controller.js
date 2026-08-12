const orderService = require("../service/order.service");

// ============================================================
// Customer
// ============================================================

async function createOrder(req, res, next) {
  try {
    const { items } = req.body;

    const order = await orderService.createOrder(
      {
        _id: req.user.userId,
      },
      items
    );

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function getCustomerOrders(req, res, next) {
  try {
    const { page, limit } = req.query;

    const result = await orderService.getCustomerOrders(
      req.user.userId,
      {
        page,
        limit,
      }
    );

    return res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function getCustomerOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.getCustomerOrderById(
      req.user.userId,
      id
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}


// ============================================================
// Operator
// ============================================================

async function getOperatorOrders(req, res, next) {
  try {
    const { status, page, limit } = req.query;

    const result = await orderService.getOperatorOrders({
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function getOperatorOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.getOperatorOrderById(id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function startQuoting(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.startQuoting(id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function updateOrderItemPricing(req, res, next) {
  try {
    const { id, itemIndex } = req.params;

    const {
      availabilityStatus,
      unitPrice,
      description,
    } = req.body;

    const order = await orderService.updateOrderItemPricing(
      id,
      Number(itemIndex),
      availabilityStatus,
      unitPrice,
      description
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function submitQuote(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.submitQuote(id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function confirmOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.confirmOrder(id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.cancelOrder(id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}


module.exports = {
  // Customer
  createOrder,
  getCustomerOrders,
  getCustomerOrderById,

  // Operator
  getOperatorOrders,
  getOperatorOrderById,
  startQuoting,
  updateOrderItemPricing,
  submitQuote,
  confirmOrder,
  cancelOrder,
};