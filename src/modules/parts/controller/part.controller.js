const partService = require("../service/part.service");
const mongoose = require("mongoose");

async function createPart(req, res, next) {
  try {
    const allowedFields = [
      "name",
      "categoryId",
      "images",
      "description",
      "compatibility",
      "minPrice",
      "maxPrice",
    ];

    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      const error = new Error(
        `Invalid fields: ${invalidFields.join(", ")}`,
      );
      error.statusCode = 400;
      throw error;
    }

    const {
      name,
      categoryId,
      images = [],
      description,
      compatibility = [],
      minPrice,
      maxPrice,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      const error = new Error("Name is required");
      error.statusCode = 400;
      throw error;
    }

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      const error = new Error("Valid categoryId is required");
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(images)) {
      const error = new Error("Images must be an array");
      error.statusCode = 400;
      throw error;
    }

    if (images.some((image) => typeof image !== "string")) {
      const error = new Error("Each image must be a string");
      error.statusCode = 400;
      throw error;
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      const error = new Error("Description must be a string");
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(compatibility)) {
      const error = new Error("Compatibility must be an array");
      error.statusCode = 400;
      throw error;
    }

    if (
      compatibility.some(
        (id) => !mongoose.Types.ObjectId.isValid(id),
      )
    ) {
      const error = new Error(
        "Each compatibility ID must be a valid ObjectId",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      minPrice === undefined ||
      typeof minPrice !== "number" ||
      minPrice < 0
    ) {
      const error = new Error(
        "minPrice is required and must be a number >= 0",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      maxPrice === undefined ||
      typeof maxPrice !== "number" ||
      maxPrice < 0
    ) {
      const error = new Error(
        "maxPrice is required and must be a number >= 0",
      );
      error.statusCode = 400;
      throw error;
    }

    if (minPrice > maxPrice) {
      const error = new Error(
        "minPrice cannot be greater than maxPrice",
      );
      error.statusCode = 400;
      throw error;
    }

    const part = await partService.createPart({
      name: name.trim(),
      categoryId,
      images,
      description: description?.trim(),
      compatibility,
      minPrice,
      maxPrice,
    });

    res.status(201).json({
      success: true,
      data: part,
    });
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

    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      const error = new Error(
        `Invalid fields: ${invalidFields.join(", ")}`,
      );
      error.statusCode = 400;
      throw error;
    }

    if (receivedFields.length === 0) {
      const error = new Error("No data provided for update");
      error.statusCode = 400;
      throw error;
    }

    const {
      name,
      categoryId,
      images,
      description,
      compatibility,
      minPrice,
      maxPrice,
      isActive,
    } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      const error = new Error("Name must be a non-empty string");
      error.statusCode = 400;
      throw error;
    }

    if (
      categoryId !== undefined &&
      !mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      const error = new Error("Invalid categoryId");
      error.statusCode = 400;
      throw error;
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        const error = new Error("Images must be an array");
        error.statusCode = 400;
        throw error;
      }

      if (images.some((image) => typeof image !== "string")) {
        const error = new Error("Each image must be a string");
        error.statusCode = 400;
        throw error;
      }
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      const error = new Error("Description must be a string");
      error.statusCode = 400;
      throw error;
    }

    if (compatibility !== undefined) {
      if (!Array.isArray(compatibility)) {
        const error = new Error("Compatibility must be an array");
        error.statusCode = 400;
        throw error;
      }

      if (
        compatibility.some(
          (id) => !mongoose.Types.ObjectId.isValid(id),
        )
      ) {
        const error = new Error(
          "Each compatibility ID must be a valid ObjectId",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (
      minPrice !== undefined &&
      (typeof minPrice !== "number" || minPrice < 0)
    ) {
      const error = new Error(
        "minPrice must be a number >= 0",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      maxPrice !== undefined &&
      (typeof maxPrice !== "number" || maxPrice < 0)
    ) {
      const error = new Error(
        "maxPrice must be a number >= 0",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      const error = new Error(
        "minPrice cannot be greater than maxPrice",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      const error = new Error("isActive must be a boolean");
      error.statusCode = 400;
      throw error;
    }

    const data = {
      ...(name !== undefined && { name: name.trim() }),
      ...(categoryId !== undefined && { categoryId }),
      ...(images !== undefined && { images }),
      ...(description !== undefined && {
        description: description?.trim(),
      }),
      ...(compatibility !== undefined && { compatibility }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
      ...(isActive !== undefined && { isActive }),
    };

    const part = await partService.updatePart(
      req.params.id,
      data,
    );

    res.status(200).json({
      success: true,
      data: part,
    });
  } catch (error) {
    next(error);
  }
}

async function deletePart(req, res, next) {
  try {
    await partService.deletePart(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Part deactivated successfully" });
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
    const part = await partService.removeCompatibility(
      req.params.id,
      carModelIds,
    );
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
