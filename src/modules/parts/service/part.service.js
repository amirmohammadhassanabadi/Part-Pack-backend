const Part = require("../model/part.model");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildPagination(page, limit) {
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(limit) || DEFAULT_LIMIT),
  );
  const skip = (parsedPage - 1) * parsedLimit;
  return { parsedPage, parsedLimit, skip };
}

async function createPart({
  name,
  categoryId,
  images = [],
  description,
  compatibility = [],
  minPrice,
  maxPrice,
}) {
  const exists = await Part.findOne({ name, categoryId });

  if (exists) {
    throw new Error("Part already exists in this category");
  }

  const avg = (minPrice + maxPrice) / 2;

  const part = await Part.create({
    name,
    categoryId,
    images,
    description,
    compatibility,
    priceStats: {
      min: minPrice,
      max: maxPrice,
      avg,
    },
  });

  return part;
}

async function getParts({
  categoryId,
  carModelId,
  name,
  onlyActive = false,
  page,
  limit,
} = {}) {
  const filter = {};

  if (categoryId) filter.categoryId = categoryId;
  if (carModelId) filter.compatibility = carModelId;
  if (onlyActive) filter.isActive = true;
  if (name) filter.name = { $regex: name, $options: "i" };

  const { parsedPage, parsedLimit, skip } = buildPagination(page, limit);

  const [data, total] = await Promise.all([
    Part.find(filter).skip(skip).limit(parsedLimit).sort({ name: 1 }),
    Part.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

async function getPartById(id) {
  const part = await Part.findById(id).populate({
    path: "compatibility",
    populate: {
      path: "brand",
    },
  });

  if (!part) {
    throw new Error("Part not found");
  }

  return part;
}

async function updatePart(id, data) {
  const allowedFields = [
    "name",
    "categoryId",
    "images",
    "description",
    "compatibility",
    "minPrice",
    "maxPrice",
    "isActive",
  ];

  const receivedFields = Object.keys(data);

  const invalidFields = receivedFields.filter(
    (field) => !allowedFields.includes(field),
  );

  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
  }

  if (receivedFields.length === 0) {
    throw new Error("No data provided for update");
  }

  const existingPart = await Part.findById(id);

  if (!existingPart) {
    throw new Error("Part not found");
  }

  if (data.name || data.categoryId) {
    const checkName = data.name || existingPart.name;
    const checkCategory = data.categoryId || existingPart.categoryId;

    const exists = await Part.findOne({
      name: checkName,
      categoryId: checkCategory,
      _id: { $ne: id },
    });

    if (exists) {
      throw new Error("Part already exists in this category");
    }
  }

  if (
    data.minPrice !== undefined ||
    data.maxPrice !== undefined
  ) {
    const minPrice =
      data.minPrice !== undefined
        ? data.minPrice
        : existingPart.priceStats.min;

    const maxPrice =
      data.maxPrice !== undefined
        ? data.maxPrice
        : existingPart.priceStats.max;

    if (minPrice > maxPrice) {
      throw new Error("minPrice cannot be greater than maxPrice");
    }

    data.priceStats = {
      ...existingPart.priceStats.toObject(),
      min: minPrice,
      max: maxPrice,
      avg: (minPrice + maxPrice) / 2,
      computedAt: new Date(),
    };

    delete data.minPrice;
    delete data.maxPrice;
  }

  const updated = await Part.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  return updated;
}

async function deletePart(id) {
  const deleted = await Part.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  if (!deleted) throw new Error("Part not found");
  return deleted;
}

async function addCompatibility(id, carModelIds) {
  const updated = await Part.findByIdAndUpdate(
    id,
    { $addToSet: { compatibility: { $each: carModelIds } } },
    { new: true },
  );
  if (!updated) throw new Error("Part not found");
  return updated;
}

async function removeCompatibility(id, carModelIds) {
  const updated = await Part.findByIdAndUpdate(
    id,
    { $pull: { compatibility: { $in: carModelIds } } },
    { new: true },
  );
  if (!updated) throw new Error("Part not found");
  return updated;
}

module.exports = {
  createPart,
  getParts,
  getPartById,
  updatePart,
  deletePart,
  addCompatibility,
  removeCompatibility,
};
