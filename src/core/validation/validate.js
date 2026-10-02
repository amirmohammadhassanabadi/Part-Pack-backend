function validateBody(validator) {
  return (req, res, next) => {
    try {
      const result = validator(req.body || {});
      if (result !== undefined) req.body = result;
      next();
    } catch (error) {
      error.statusCode = error.statusCode || 400;
      next(error);
    }
  };
}

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function validateCreateOrder(body) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new Error("items must contain at least one item");
  }
  for (const item of body.items) {
    requiredString(item?.partId, "partId");
    requiredString(item?.carModelId, "carModelId");
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      throw new Error("qty must be a positive integer");
    }
  }
  return body;
}

function validateSelectOffers(body) {
  if (!Array.isArray(body.selections) || body.selections.length === 0) {
    throw new Error("selections must contain at least one decision");
  }
  return body;
}

function validateOffer(body) {
  const availability = body.availability;
  if (!["available", "unavailable"].includes(availability)) {
    throw new Error("availability must be available or unavailable");
  }
  if (availability === "available") {
    requiredString(body.brandName, "brandName");
    if (typeof body.unitPrice !== "number" || body.unitPrice < 0) {
      throw new Error("unitPrice must be a non-negative number");
    }
    if (!Number.isInteger(body.availableQuantity) || body.availableQuantity < 1) {
      throw new Error("availableQuantity must be a positive integer");
    }
  } else {
    requiredString(body.description, "description");
  }
  return body;
}

function validateCustomer(body) {
  requiredString(body.fullName, "fullName");
  requiredString(body.phone, "phone");
  return body;
}

function validateOtpRequest(body) {
  requiredString(body.phone, "phone");
  return body;
}

function validateOtpVerification(body) {
  requiredString(body.phone, "phone");
  requiredString(body.code, "code");
  return body;
}

module.exports = {
  validateBody,
  validateCreateOrder,
  validateSelectOffers,
  validateOffer,
  validateCustomer,
  validateOtpRequest,
  validateOtpVerification,
};
