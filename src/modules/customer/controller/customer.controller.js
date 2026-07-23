const mongoose = require("mongoose");
const customerService = require("../services/customer.service");

function buildError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function validateCreateCustomerBody(body) {
  const fullName = normalizeString(body.fullName);
  const phone = normalizeString(body.phone);

  if (!fullName) {
    throw buildError("fullName is required", 400);
  }

  if (typeof fullName !== "string" || fullName.length < 3) {
    throw buildError("fullName must be a string with at least 3 characters", 400);
  }

  if (!phone) {
    throw buildError("phone is required", 400);
  }

  if (typeof phone !== "string") {
    throw buildError("phone must be a string", 400);
  }

  // نمونه ساده؛ اگر خواستی می‌تونیم regex دقیق‌تر برای موبایل ایران بگذاریم
  if (!/^09\d{9}$/.test(phone)) {
    throw buildError("phone format is invalid", 400);
  }

  const payload = {
    fullName,
    phone,
  };

  if (body.addresses !== undefined) {
    if (!Array.isArray(body.addresses)) {
      throw buildError("addresses must be an array", 400);
    }

    payload.addresses = body.addresses.map(validateAddressInput);
  }

  if (body.carModels !== undefined) {
    if (!Array.isArray(body.carModels)) {
      throw buildError("carModels must be an array", 400);
    }

    payload.carModels = body.carModels.map(validateCarInput);
  }

  return payload;
}

function validateAddressInput(address) {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw buildError("address payload is invalid", 400);
  }

  const title = normalizeString(address.title);
  const province = normalizeString(address.province);
  const city = normalizeString(address.city);
  const line = normalizeString(address.line);
  const postalCode = normalizeString(address.postalCode);

  if (!title) throw buildError("address.title is required", 400);
  if (!province) throw buildError("address.province is required", 400);
  if (!city) throw buildError("address.city is required", 400);
  if (!line) throw buildError("address.line is required", 400);

  return {
    title,
    province,
    city,
    line,
    ...(postalCode ? { postalCode } : {}),
  };
}

function validateCarInput(car) {
  if (!car || typeof car !== "object" || Array.isArray(car)) {
    throw buildError("car payload is invalid", 400);
  }

  const carModelId = normalizeString(car.carModelId);
  const year = normalizeString(car.year);
  const vin = normalizeString(car.vin);

  if (!carModelId) {
    throw buildError("carModelId is required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(carModelId)) {
    throw buildError("carModelId is invalid", 400);
  }

  return {
    carModelId,
    ...(year ? { year } : {}),
    ...(vin ? { vin } : {}),
  };
}

function validateObjectIdField(value, fieldName) {
  const normalized = normalizeString(value);

  if (!normalized) {
    throw buildError(`${fieldName} is required`, 400);
  }

  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throw buildError(`${fieldName} is invalid`, 400);
  }

  return normalized;
}

async function createCustomer(req, res, next) {
  try {
    const payload = validateCreateCustomerBody(req.body);
    const customer = await customerService.createCustomer(payload);
    return res.status(201).json(customer);
  } catch (error) {
    return next(error);
  }
}

async function getAllCustomers(req, res, next) {
  try {
    const filters = {};

    if (req.query.phone) {
      filters.phone = normalizeString(req.query.phone);
    }

    if (req.query.fullName) {
      filters.fullName = { $regex: normalizeString(req.query.fullName), $options: "i" };
    }

    if (req.query.isActive !== undefined) {
      if (req.query.isActive === "true") filters.isActive = true;
      else if (req.query.isActive === "false") filters.isActive = false;
      else throw buildError("isActive must be true or false", 400);
    }

    const customers = await customerService.getAllCustomers(filters);
    return res.status(200).json(customers);
  } catch (error) {
    return next(error);
  }
}

async function getCustomerById(req, res, next) {
  try {
    const customerId = validateObjectIdField(req.params.id, "customer id");
    const customer = await customerService.getCustomerById(customerId);
    return res.status(200).json(customer);
  } catch (error) {
    return next(error);
  }
}

async function addAddressToCustomer(req, res, next) {
  try {
    const customerId = validateObjectIdField(req.params.id, "customer id");
    const addressPayload = validateAddressInput(req.body);

    const customer = await customerService.addAddress(customerId, addressPayload);
    return res.status(200).json(customer);
  } catch (error) {
    return next(error);
  }
}

async function addCarToCustomer(req, res, next) {
  try {
    const customerId = validateObjectIdField(req.params.id, "customer id");
    const carPayload = validateCarInput(req.body);

    const customer = await customerService.addCarToCustomer(customerId, carPayload);
    return res.status(200).json(customer);
  } catch (error) {
    return next(error);
  }
}

async function addOrderToCustomer(req, res, next) {
  try {
    const customerId = validateObjectIdField(req.params.id, "customer id");
    const orderId = validateObjectIdField(req.body.orderId, "orderId");

    const customer = await customerService.addOrderToCustomer(customerId, orderId);
    return res.status(200).json(customer);
  } catch (error) {
    return next(error);
  }
}

async function addInvoiceToCustomer(req, res, next) {
  try {
    const customerId = validateObjectIdField(req.params.id, "customer id");
    const invoiceId = validateObjectIdField(req.body.invoiceId, "invoiceId");

    const customer = await customerService.addInvoiceToCustomer(customerId, invoiceId);
    return res.status(200).json(customer);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  addAddressToCustomer,
  addCarToCustomer,
  addOrderToCustomer,
  addInvoiceToCustomer,
};
