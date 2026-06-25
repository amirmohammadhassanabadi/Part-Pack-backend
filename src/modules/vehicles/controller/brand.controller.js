const brandService = require("../service/brand.service");

async function createBrand(req, res, next) {
  try {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
}

async function getBrands(req, res, next) {
  try {
    const onlyActive = req.query.onlyActive === "true";
    const brands = await brandService.getBrands({ onlyActive });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
}

async function getBrandById(req, res, next) {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
}

async function updateBrand(req, res, next) {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
}

async function deleteBrand(req, res, next) {
  try {
    await brandService.deleteBrand(req.params.id);
    res.status(200).json({ success: true, message: "Brand deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { createBrand, getBrands, getBrandById, updateBrand, deleteBrand };