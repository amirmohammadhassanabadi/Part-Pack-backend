const CarModel = require("../model/carModel.model");
const Brand = require("../model/brand.model");
const mongoose = require("mongoose");
const slugify = require("slugify");

async function createCarModel({ name, brand, yearRange, logoUrl }) {
  if (!mongoose.Types.ObjectId.isValid(brand)) throw new Error("Invalid brand ID");
  const brandExists = await Brand.findById(brand);
  if (!brandExists) throw new Error("Brand not found");
  if (!brandExists.isActive) throw new Error("Brand is not active");

  const slug = slugify(name, { lower: true, strict: true });

  const exists = await CarModel.findOne({ slug, brand });
  if (exists) throw new Error("CarModel already exists for this brand");

  const carModel = await CarModel.create({
    name,
    slug,
    brand,
    yearRange,
  });

  return carModel;
}

async function getCarModels({ brandId, onlyActive = false } = {}) {
  const filter = {};
  if (brandId) filter.brand = brandId;
  if (onlyActive) filter.isActive = true;

  return CarModel.find(filter).populate("brand", "name slug").sort({ name: 1 });
}

async function getCarModelById(id) {
  const carModel = await CarModel.findById(id).populate("brand", "name slug");
  if (!carModel) throw new Error("CarModel not found");
  return carModel;
}

async function updateCarModel(id, data) {
  const allowedFields = ["name", "yearRange", "isActive"];
  const receivedFields = Object.keys(data);
  const invalidFields = receivedFields.filter(
    (f) => !allowedFields.includes(f),
  );

  if (invalidFields.length > 0)
    throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
  if (receivedFields.length === 0)
    throw new Error("No data provided for update");

  if (data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });

    const carModel = await CarModel.findById(id);
    if (!carModel) throw new Error("CarModel not found");

    const exists = await CarModel.findOne({
      slug: data.slug,
      brand: carModel.brand,
      _id: { $ne: id },
    });
    if (exists)
      throw new Error("CarModel with this name already exists for this brand");
  }

  const updated = await CarModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new Error("CarModel not found");

  return updated;
}

async function deleteCarModel(id) {
  const deleted = await CarModel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  if (!deleted) throw new Error("CarModel not found");
  return deleted;
}

module.exports = {
  createCarModel,
  getCarModels,
  getCarModelById,
  updateCarModel,
  deleteCarModel,
};
