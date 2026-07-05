const partService = require("../service/part.service");

async function createPart(req, res, next) {
  try {
    const part = await partService.createPart(req.body);
    res.status(201).json({ success: true, data: part });
  } catch (error) {
    next(error);
  }
}

async function getParts(req, res, next) {
  try {
    const { categoryId, carModelId, name, onlyActive, page, limit } = req.query;
    const result = await partService.getParts({
      categoryId,
      carModelId,
      name,
      onlyActive: onlyActive === "true",
      page,
      limit,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getPartById(req, res, next) {
  try {
    const part = await partService.getPartById(req.params.id);
    res.status(200).json({ success: true, data: part });
  } catch (error) {
    next(error);
  }
}

async function updatePart(req, res, next) {
  try {
    const part = await partService.updatePart(req.params.id, req.body);
    res.status(200).json({ success: true, data: part });
  } catch (error) {
    next(error);
  }
}

async function deletePart(req, res, next) {
  try {
    await partService.deletePart(req.params.id);
    res.status(200).json({ success: true, message: "Part deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

async function addCompatibility(req, res, next) {
  try {
    const { carModelIds } = req.body;
    const part = await partService.addCompatibility(req.params.id, carModelIds);
    res.status(200).json({ success: true, data: part });
  } catch (error) {
    next(error);
  }
}

async function removeCompatibility(req, res, next) {
  try {
    const { carModelIds } = req.body;
    const part = await partService.removeCompatibility(req.params.id, carModelIds);
    res.status(200).json({ success: true, data: part });
  } catch (error) {
    next(error);
  }
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