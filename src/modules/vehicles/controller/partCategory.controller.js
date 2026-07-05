const partCategoryService = require("../service/partCategory.service");

async function createPartCategory(req, res, next) {
  try {
    const partCategory = await partCategoryService.createPartCategory(req.body);
    res.status(201).json({ success: true, data: partCategory });
  } catch (error) {
    next(error);
  }
}

async function getPartCategories(req, res, next) {
  try {
    const { parentId, onlyActive } = req.query;
    const partCategories = await partCategoryService.getPartCategories({
      parentId: parentId || undefined,
      onlyActive: onlyActive === "true",
    });
    res.status(200).json({ success: true, data: partCategories });
  } catch (error) {
    next(error);
  }
}

async function getPartCategoryById(req, res, next) {
  try {
    const partCategory = await partCategoryService.getPartCategoryById(req.params.id);
    res.status(200).json({ success: true, data: partCategory });
  } catch (error) {
    next(error);
  }
}

async function updatePartCategory(req, res, next) {
  try {
    const partCategory = await partCategoryService.updatePartCategory(req.params.id, req.body);
    res.status(200).json({ success: true, data: partCategory });
  } catch (error) {
    next(error);
  }
}

async function deletePartCategory(req, res, next) {
  try {
    await partCategoryService.deletePartCategory(req.params.id);
    res.status(200).json({ success: true, message: "PartCategory deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPartCategory,
  getPartCategories,
  getPartCategoryById,
  updatePartCategory,
  deletePartCategory,
};