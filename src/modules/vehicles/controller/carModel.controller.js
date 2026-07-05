const carModelService = require("../service/carModel.service");

async function createCarModel(req, res, next) {
  try {
    const carModel = await carModelService.createCarModel(req.body);
    res.status(201).json({ success: true, data: carModel });
  } catch (error) {
    next(error);
  }
}

async function getCarModels(req, res, next) {
  try {
    const { brandId, onlyActive } = req.query;
    const carModels = await carModelService.getCarModels({
      brandId,
      onlyActive: onlyActive === "true",
    });
    res.status(200).json({ success: true, data: carModels });
  } catch (error) {
    next(error);
  }
}

async function getCarModelById(req, res, next) {
  try {
    const carModel = await carModelService.getCarModelById(req.params.id);
    res.status(200).json({ success: true, data: carModel });
  } catch (error) {
    next(error);
  }
}

async function updateCarModel(req, res, next) {
  try {
    const carModel = await carModelService.updateCarModel(req.params.id, req.body);
    res.status(200).json({ success: true, data: carModel });
  } catch (error) {
    next(error);
  }
}

async function deleteCarModel(req, res, next) {
  try {
    await carModelService.deleteCarModel(req.params.id);
    res.status(200).json({ success: true, message: "CarModel deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { createCarModel, getCarModels, getCarModelById, updateCarModel, deleteCarModel };