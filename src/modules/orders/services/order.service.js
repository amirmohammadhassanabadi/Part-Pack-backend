const mongoose = require("mongoose");
const Order = require("./order.model");
const Part = require("../part/part.model");
const CarModel = require("../carModel/carModel.model");

async function createOrder(customer, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const partIds = items.map((item) => item.partId);

  // Make sure all IDs are valid MongoDB ObjectIds
  if (partIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new Error("Invalid part ID");
  }

  const carModelIds = items.map((item) => item.carModelId);

  if (carModelIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new Error("Invalid car model ID");
  }

  // Fetch all required parts
  const parts = await Part.find({
    _id: { $in: partIds },
    isActive: true,
  }).lean();

  // Fetch all required car models
  const carModels = await CarModel.find({
    _id: { $in: carModelIds },
    isActive: true,
  }).lean();

  if (parts.length !== new Set(partIds.map(String)).size) {
    throw new Error("One or more parts were not found");
  }

  if (carModels.length !== new Set(carModelIds.map(String)).size) {
    throw new Error("One or more car models were not found");
  }

  const partMap = new Map(
    parts.map((part) => [String(part._id), part])
  );

  const carModelMap = new Map(
    carModels.map((carModel) => [String(carModel._id), carModel])
  );

  const orderItems = items.map((item) => {
    const part = partMap.get(String(item.partId));
    const carModel = carModelMap.get(String(item.carModelId));

    if (!part) {
      throw new Error(`Part not found: ${item.partId}`);
    }

    if (!carModel) {
      throw new Error(`Car model not found: ${item.carModelId}`);
    }

    // Make sure this car model is compatible with the selected part
    const isCompatible = part.compatibility.some(
      (id) => String(id) === String(carModel._id)
    );

    if (!isCompatible) {
      throw new Error(
        `Part "${part.name}" is not compatible with car model "${carModel.name}"`
      );
    }

    return {
      partId: part._id,
      carModelId: carModel._id,
      categoryId: part.categoryId,
      title: part.name,
      qty: item.qty,
    };
  });

  const order = await Order.create({
    status: "pending",

    customer: {
      customerId: customer._id,
      name: customer.name,
      phone: customer.phone,
    },

    items: orderItems,

    invitations: [],
  });

  return order;
}

module.exports = {
  createOrder,
};