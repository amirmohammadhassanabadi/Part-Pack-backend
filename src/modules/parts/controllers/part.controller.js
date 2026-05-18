const partService = require("../services/part.service");

class PartController {
  async createPart(req, res, next) {
    try {
      const part = await partService.createPart(req.body);

      res.status(201).json({
        success: true,
        data: part,
      });
    } catch (error) {
      next(error);
    }
  }

  async getParts(req, res, next) {
    try {
      const { limit, skip, onlyActive } = req.query;

      const parts = await partService.getParts({
        limit: Number(limit) || 50,
        skip: Number(skip) || 0,
        onlyActive: onlyActive !== "false",
      });

      res.json({
        success: true,
        data: parts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPartById(req, res, next) {
    try {
      const { id } = req.params;

      const part = await partService.getPartById(id);

      res.json({
        success: true,
        data: part,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchParts(req, res, next) {
    try {
      const { q } = req.query;

      const parts = await partService.searchParts(q);

      res.json({
        success: true,
        data: parts,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePart(req, res, next) {
    try {
      const { id } = req.params;

      const part = await partService.updatePart(id, req.body);

      res.json({
        success: true,
        data: part,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePart(req, res, next) {
    try {
      const { id } = req.params;

      const part = await partService.deletePart(id);

      res.json({
        success: true,
        data: part,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PartController();
