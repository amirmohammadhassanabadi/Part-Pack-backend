// modules/staff/controller/staff.controller.js
const mongoose = require("mongoose");
const staffService = require("../service/staff.service");

function parseBoolean(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

function sanitizeUpdateBody(body) {
  const payload = {};

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== "string" || !body.fullName.trim()) {
      throw new Error("fullName is invalid.");
    }
    payload.fullName = body.fullName.trim();
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || !body.phone.trim()) {
      throw new Error("phone is invalid.");
    }
    payload.phone = body.phone.trim();
  }

  if (body.role !== undefined) {
    const allowedRoles = ["admin", "operator"];
    if (!allowedRoles.includes(body.role)) {
      throw new Error("role is invalid.");
    }
    payload.role = body.role;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw new Error("isActive must be boolean.");
    }
    payload.isActive = body.isActive;
  }

  return payload;
}

async function getAllStaff(req, res, next) {
  try {
    const filters = {
      phone: req.query.phone,
      fullName: req.query.fullName,
      role: req.query.role,
      isActive: parseBoolean(req.query.isActive),
    };

    const staff = await staffService.getAllStaff(filters);
    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
}

async function getStaffById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }

    const staff = await staffService.getStaffById(req.params.id);
    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
}

async function updateStaff(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }

    const payload = sanitizeUpdateBody(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided." });
    }

    const staff = await staffService.updateStaff(req.params.id, payload);
    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
}

async function updateStaffStatus(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be boolean." });
    }

    const staff = await staffService.updateStaffStatus(req.params.id, isActive);
    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
};
