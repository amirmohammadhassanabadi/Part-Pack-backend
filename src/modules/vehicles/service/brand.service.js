const Brand = require("../model/brand.model");
const slugify = require("slugify");

async function createBrand({ name, logoUrl, country }) {
  const slug = slugify(name, { lower: true, strict: true });

  const exists = await Brand.findOne({ slug });
  if (exists) throw new Error("Brand already exists");

  const brand = await Brand.create({
    name,
    slug,
    logoUrl: logoUrl || null,
    country: country || null,
  });

  return brand;
}

async function getBrands({ onlyActive = false } = {}) {
  const filter = {};
  if (onlyActive) filter.isActive = true;
  return Brand.find(filter).sort({ name: 1 });
}

async function getBrandById(id) {
  const brand = await Brand.findById(id);
  if (!brand) throw new Error("Brand not found");
  return brand;
}

async function updateBrand(id, data) {
  const allowedFields = ["name", "logoUrl", "country", "isActive"];
  const receivedFields = Object.keys(data);
  const invalidFields = receivedFields.filter((f) => !allowedFields.includes(f));

  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
  }

  if (receivedFields.length === 0) {
    throw new Error("No data provided for update");
  }

  if (data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });

    const exists = await Brand.findOne({ slug: data.slug, _id: { $ne: id } });
    if (exists) throw new Error("Brand with this name already exists");
  }

  const updated = await Brand.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new Error("Brand not found");

  return updated;
}

async function deleteBrand(id) {
  const deleted = await Brand.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!deleted) throw new Error("Brand not found");
  return deleted;
}

module.exports = { createBrand, getBrands, getBrandById, updateBrand, deleteBrand };