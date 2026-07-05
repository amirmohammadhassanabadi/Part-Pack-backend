const PartCategory = require("../model/partCategory.models");
const slugify = require("slugify");

async function createPartCategory({ name, parentId = null }) {
  const slug = slugify(name, { lower: true, strict: true });

  const exists = await PartCategory.findOne({ slug });
  if (exists) throw new Error("PartCategory already exists");

  if (parentId) {
    const parent = await PartCategory.findById(parentId);
    if (!parent) throw new Error("Parent category not found");
    if (!parent.isActive) throw new Error("Parent category is not active");
  }

  const partCategory = await PartCategory.create({
    name,
    slug,
    parentId,
  });

  return partCategory;
}

async function getPartCategories({ parentId, onlyActive = false } = {}) {
  const filter = {};
  if (parentId) filter.parentId = parentId;
  if (parentId === null) filter.parentId = null;
  if (onlyActive) filter.isActive = true;

  return PartCategory.find(filter).sort({ name: 1 });
}

async function getPartCategoryById(id) {
  const partCategory = await PartCategory.findById(id);
  if (!partCategory) throw new Error("PartCategory not found");
  return partCategory;
}

async function updatePartCategory(id, data) {
  const allowedFields = ["name", "parentId", "isActive"];
  const receivedFields = Object.keys(data);
  const invalidFields = receivedFields.filter((f) => !allowedFields.includes(f));

  if (invalidFields.length > 0) throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
  if (receivedFields.length === 0) throw new Error("No data provided for update");

  if (data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });

    const exists = await PartCategory.findOne({ slug: data.slug, _id: { $ne: id } });
    if (exists) throw new Error("PartCategory with this name already exists");
  }

  if (data.parentId) {
    if (data.parentId === id) throw new Error("Category cannot be its own parent");

    const parent = await PartCategory.findById(data.parentId);
    if (!parent) throw new Error("Parent category not found");
    if (!parent.isActive) throw new Error("Parent category is not active");
  }

  const updated = await PartCategory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new Error("PartCategory not found");

  return updated;
}

async function deletePartCategory(id) {
  const hasChildren = await PartCategory.findOne({ parentId: id });
  if (hasChildren) throw new Error("Cannot deactivate a category that has subcategories");

  const deleted = await PartCategory.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!deleted) throw new Error("PartCategory not found");
  return deleted;
}

module.exports = {
  createPartCategory,
  getPartCategories,
  getPartCategoryById,
  updatePartCategory,
  deletePartCategory,
};