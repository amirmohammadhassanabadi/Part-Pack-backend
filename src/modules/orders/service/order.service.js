const mongoose = require("mongoose");

const Order = require("../model/order.model");
const Part = require("../../parts/model/part.model");
const CarModel = require("../../vehicles/model/carModel.model");
const Customer = require("../../customer/model/customer.model");
const Invoice = require("../../invoice/model/invoice.model");
const {
  createInvoiceFromOrder,
  cancelInvoice,
} = require("../../invoice/service/invoice.service");
const invitationService = require("../../invitation/service/invitation.service");


// ============================================================
// Helpers
// ============================================================

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

function normalizeId(id) {
  return String(id);
}

function getPartMap(parts) {
  return new Map(
    parts.map((part) => [normalizeId(part._id), part])
  );
}

function getCarModelMap(carModels) {
  return new Map(
    carModels.map((carModel) => [normalizeId(carModel._id), carModel])
  );
}


// ============================================================
// Customer
// ============================================================

/**
 * Create a new order.
 *
 * Customer sends:
 *
 * {
 *   items: [
 *     {
 *       partId,
 *       carModelId,
 *       qty
 *     }
 *   ]
 * }
 *
 * The backend determines:
 * - categoryId
 * - title
 * - availability
 * - unitPrice
 * - customer information
 */
async function createOrder(customerId, items) {
  if (!isValidObjectId(customerId)) {
    throw new Error("Invalid customer ID");
  }

  const customer = await Customer.findOne({
    _id: customerId,
    isActive: true,
  }).lean();

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const seenItems = new Set();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid order item");
    }

    if (!item.partId) {
      throw new Error("Part ID is required");
    }

    if (!item.carModelId) {
      throw new Error("Car model ID is required");
    }

    if (!Number.isInteger(item.qty) || item.qty < 1) {
      throw new Error("Quantity must be a positive integer");
    }

    if (!isValidObjectId(item.partId)) {
      throw new Error(`Invalid part ID: ${item.partId}`);
    }

    if (!isValidObjectId(item.carModelId)) {
      throw new Error(`Invalid car model ID: ${item.carModelId}`);
    }

    // Prevent the same part + car model from
    // appearing twice in the same order.
    const key = `${item.partId}:${item.carModelId}`;

    if (seenItems.has(key)) {
      throw new Error(
        `Duplicate order item: part ${item.partId} for car model ${item.carModelId}`
      );
    }

    seenItems.add(key);
  }

  const partIds = items.map((item) => item.partId);
  const carModelIds = items.map((item) => item.carModelId);

  const [parts, carModels] = await Promise.all([
    Part.find({
      _id: { $in: partIds },
      isActive: true,
    }).lean(),

    CarModel.find({
      _id: { $in: carModelIds },
      isActive: true,
    }).lean(),
  ]);

  const partMap = getPartMap(parts);
  const carModelMap = getCarModelMap(carModels);

  const orderItems = [];

  for (const item of items) {
    const part = partMap.get(normalizeId(item.partId));
    const carModel = carModelMap.get(normalizeId(item.carModelId));

    if (!part) {
      throw new Error(`Part not found: ${item.partId}`);
    }

    if (!carModel) {
      throw new Error(`Car model not found: ${item.carModelId}`);
    }

    // Verify that the selected car model is compatible
    // with the selected part.
    const compatible = (part.compatibility || []).some(
      (compatibleCarModelId) =>
        normalizeId(compatibleCarModelId) ===
        normalizeId(carModel._id)
    );

    if (!compatible) {
      throw new Error(
        `Part "${part.name}" is not compatible with car model "${carModel.name}"`
      );
    }

    orderItems.push({
      partId: part._id,
      carModelId: carModel._id,
      categoryId: part.categoryId,
      title: part.name,
      qty: item.qty,

      availability: {
        status: "pending",
        description: null,
      },

      unitPrice: null,
    });
  }

  const order = await Order.create({
    status: "pending",

    customer: {
      customerId: customer._id,
      name: customer.fullName,
      phone: customer.phone,
    },

    items: orderItems,
  });

  await invitationService.createInvitationsForOrder(order._id);

  return Order.findById(order._id);
}


/**
 * Get customer's orders.
 */
async function getCustomerOrders(customerId, options = {}) {
  if (!isValidObjectId(customerId)) {
    throw new Error("Invalid customer ID");
  }

  const {
    page = 1,
    limit = 20,
  } = options;

  const safePage = Math.max(Number(page) || 1, 1);

  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip = (safePage - 1) * safeLimit;

  const filter = {
    "customer.customerId": customerId,
  };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}


/**
 * Get one order belonging to the customer.
 */
async function getCustomerOrderById(customerId, orderId) {
  if (!isValidObjectId(customerId)) {
    throw new Error("Invalid customer ID");
  }

  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findOne({
    _id: orderId,
    "customer.customerId": customerId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}


// ============================================================
// Operator
// ============================================================

/**
 * Get orders for the operator dashboard.
 *
 * Optional:
 *
 * ?status=pending
 * ?status=quoting
 * ?status=quoted
 * ?status=confirmed
 * ?status=cancelled
 */
async function getOperatorOrders(options = {}) {
  const {
    status,
    page = 1,
    limit = 20,
  } = options;

  const filter = {};

  if (status) {
    const allowedStatuses = [
      "pending",
      "supplier_invitation",
      "collecting_offers",
      "offers_ready",
      "confirmed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid order status");
    }

    filter.status = status;
  }

  const safePage = Math.max(Number(page) || 1, 1);

  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}


/**
 * Get one order for the operator.
 */
async function getOperatorOrderById(orderId) {
  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}


// ============================================================
// Operator - Start quoting
// ============================================================

/**
 * Move:
 *
 * pending -> quoting
 *
 * This means the operator has started processing
 * the customer's order.
 */
async function startQuoting(orderId) {
  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "pending") {
    throw new Error(
      `Order cannot start quoting from status "${order.status}"`
    );
  }

  order.status = "supplier_invitation";

  await order.save();

  return order;
}


// ============================================================
// Operator - Update item pricing
// ============================================================

/**
 * Update availability and price of one order item.
 *
 * pending:
 *   unitPrice = null
 *   description = null
 *
 * available:
 *   unitPrice required
 *   description optional
 *
 * unavailable:
 *   unitPrice = null
 *   description required
 */
async function updateOrderItemPricing(
  orderId,
  itemIndex,
  availabilityStatus,
  unitPrice = null,
  description = null
) {
  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "collecting_offers") {
    throw new Error(
      "Order must be in collecting_offers status before updating item pricing"
    );
  }

  const index = Number(itemIndex);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= order.items.length
  ) {
    throw new Error("Invalid order item");
  }

  const item = order.items[index];

  const allowedStatuses = [
    "pending",
    "available",
    "unavailable",
  ];

  if (!allowedStatuses.includes(availabilityStatus)) {
    throw new Error("Invalid availability status");
  }

  // ----------------------------------------------------------
  // Pending
  // ----------------------------------------------------------

  if (availabilityStatus === "pending") {
    item.availability.status = "pending";
    item.availability.description = null;
    item.unitPrice = null;
  }

  // ----------------------------------------------------------
  // Available
  // ----------------------------------------------------------

  else if (availabilityStatus === "available") {
    if (
      unitPrice === null ||
      unitPrice === undefined ||
      typeof unitPrice !== "number" ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      throw new Error(
        "A valid unit price is required for an available item"
      );
    }

    item.availability.status = "available";

    item.availability.description =
      typeof description === "string" &&
      description.trim()
        ? description.trim()
        : null;

    item.unitPrice = unitPrice;
  }

  // ----------------------------------------------------------
  // Unavailable
  // ----------------------------------------------------------

  else if (availabilityStatus === "unavailable") {
    if (
      typeof description !== "string" ||
      !description.trim()
    ) {
      throw new Error(
        "A description is required for an unavailable item"
      );
    }

    item.availability.status = "unavailable";
    item.availability.description = description.trim();
    item.unitPrice = null;
  }

  await order.save();

  return order;
}


// ============================================================
// Operator - Submit quotation
// ============================================================

/**
 * Move:
 *
 * quoting -> quoted
 *
 * Every item must have been processed.
 */
async function submitQuote(orderId) {
  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "collecting_offers") {
    throw new Error(
      `Order cannot be quoted from status "${order.status}"`
    );
  }

  for (const item of order.items) {
    // No item can remain pending.
    if (item.availability.status === "pending") {
      throw new Error(
        `Item "${item.title}" has not been processed yet`
      );
    }

    // Available item must have a price.
    if (item.availability.status === "available") {
      if (
        item.unitPrice === null ||
        item.unitPrice === undefined
      ) {
        throw new Error(
          `Item "${item.title}" is available but has no unit price`
        );
      }
    }

    // Unavailable item must have a description
    // and cannot have a price.
    if (item.availability.status === "unavailable") {
      if (
        !item.availability.description ||
        !item.availability.description.trim()
      ) {
        throw new Error(
          `Item "${item.title}" is unavailable but has no description`
        );
      }

      if (item.unitPrice !== null) {
        throw new Error(
          `Unavailable item "${item.title}" cannot have a unit price`
        );
      }
    }
  }

  // At least one item must be available.
  const availableItems = order.items.filter(
    (item) =>
      item.availability.status === "available"
  );

  if (availableItems.length === 0) {
    throw new Error(
      "Order cannot be quoted because no items are available"
    );
  }

  order.status = "offers_ready";

  await order.save();

  return order;
}


// ============================================================
// Operator - Confirm order
// ============================================================

function validateFinalOrderItems(order) {
  for (const item of order.items) {
    if (item.availability.status === "pending") {
      throw new Error(`Item "${item.title}" is still pending`);
    }

    if (item.availability.status === "available") {
      const selectedOffer = item.selectedOffer;

      if (!selectedOffer) {
        throw new Error(
          `Available item "${item.title}" has no selected supplier offer`,
        );
      }

      if (!isValidObjectId(selectedOffer.invitationId) ||
        !isValidObjectId(selectedOffer.supplierId) ||
        !isValidObjectId(selectedOffer.offerId)) {
        throw new Error(
          `Selected offer for item "${item.title}" is incomplete`,
        );
      }

      if (
        !Number.isInteger(selectedOffer.selectedQuantity) ||
        selectedOffer.selectedQuantity < 1 ||
        selectedOffer.selectedQuantity > item.qty
      ) {
        throw new Error(
          `Selected quantity for item "${item.title}" is invalid`,
        );
      }

      if (
        typeof selectedOffer.unitPrice !== "number" ||
        !Number.isFinite(selectedOffer.unitPrice) ||
        selectedOffer.unitPrice < 0 ||
        item.unitPrice !== selectedOffer.unitPrice
      ) {
        throw new Error(
          `Selected price for item "${item.title}" is invalid`,
        );
      }
    }

    if (item.availability.status === "unavailable") {
      if (
        !item.availability.description ||
        !item.availability.description.trim()
      ) {
        throw new Error(
          `Unavailable item "${item.title}" has no description`,
        );
      }

      if (item.unitPrice !== null && item.unitPrice !== undefined) {
        throw new Error(
          `Unavailable item "${item.title}" cannot have a unit price`,
        );
      }

      if (item.selectedOffer) {
        throw new Error(
          `Unavailable item "${item.title}" cannot have a selected offer`,
        );
      }
    }
  }

  const availableItems = order.items.filter(
    (item) => item.availability.status === "available",
  );

  if (availableItems.length === 0) {
    throw new Error(
      "Order cannot be confirmed because no items are available",
    );
  }
}

/**
 * Customer has accepted the quotation.
 *
 * Move:
 *
 * offers_ready -> confirmed
 *
 * The Invoice module creates the pending invoice
 * after this operation.
 */
async function confirmOrder(orderId) {
  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "offers_ready") {
    throw new Error(
      `Order cannot be confirmed from status "${order.status}"`
    );
  }

  if (order.invoiceId) {
    throw new Error("Order already has an invoice");
  }

  validateFinalOrderItems(order);

  // Confirm the order
  order.status = "confirmed";
  await order.save();

  // Create invoice
  const invoice = await createInvoiceFromOrder(order._id);

  return {
    order,
    invoice,
  };
}


// ============================================================
// Cancel order
// ============================================================

/**
 * Cancel an order.
 *
 * If a pending Invoice already exists, it is cancelled together
 * with the Order. Paid invoices cannot be cancelled.
 */
async function cancelOrder(orderId, { reason = null, cancelledBy = null } = {}) {
  if (!isValidObjectId(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "cancelled") {
    throw new Error("Order is already cancelled");
  }

  let invoice = null;
  if (order.invoiceId) {
    invoice = await Invoice.findById(order.invoiceId).select("_id status");

    if (!invoice) {
      const error = new Error("Order invoice not found");
      error.statusCode = 409;
      throw error;
    }

    if (invoice.status === "paid") {
      const error = new Error(
        "An order with a paid invoice cannot be cancelled",
      );
      error.statusCode = 409;
      throw error;
    }

    if (!['pending', 'cancelled'].includes(invoice.status)) {
      const error = new Error(
        `Order cannot be cancelled while invoice is "${invoice.status}"`,
      );
      error.statusCode = 409;
      throw error;
    }
  }

  if (order.status === "confirmed" && !invoice) {
    const error = new Error(
      "A confirmed order must have an invoice before it can be cancelled",
    );
    error.statusCode = 409;
    throw error;
  }

  order.status = "cancelled";
  order.cancellation = {
    reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    cancelledBy: isValidObjectId(cancelledBy) ? cancelledBy : null,
    cancelledAt: new Date(),
  };

  await order.save();

  if (invoice?.status === "pending") {
    await cancelInvoice(invoice._id);
  }

  return order;
}


// ============================================================
// Exports
// ============================================================

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
