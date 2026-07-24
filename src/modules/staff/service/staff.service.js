const mongoose = require("mongoose");
const Staff = require("../model/staff.model");
const Auth = require("../../auth/model/auth.model");

function ensureValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid staff id.");
  }
}

async function getAllStaff(filters = {}) {
  const query = {};

  if (typeof filters.phone === "string" && filters.phone.trim()) {
    query.phone = filters.phone.trim();
  }

  if (typeof filters.fullName === "string" && filters.fullName.trim()) {
    query.fullName = { $regex: filters.fullName.trim(), $options: "i" };
  }

  if (typeof filters.role === "string" && filters.role.trim()) {
    query.role = filters.role.trim();
  }

  if (typeof filters.isActive === "boolean") {
    query.isActive = filters.isActive;
  }

  return Staff.find(query).sort({ createdAt: -1 });
}

async function getStaffById(id) {
  ensureValidObjectId(id);

  const staff = await Staff.findById(id);
  if (!staff) {
    throw new Error("Staff not found.");
  }

  return staff;
}

async function updateStaff(id, payload) {
  ensureValidObjectId(id);

  const staff = await Staff.findById(id);
  if (!staff) {
    throw new Error("Staff not found.");
  }

  if (payload.fullName !== undefined) {
    staff.fullName = payload.fullName;
  }

  if (payload.phone !== undefined) {
    const existingStaff = await Staff.findOne({
      phone: payload.phone,
      _id: { $ne: id },
    });

    if (existingStaff) {
      throw new Error("Phone number already exists.");
    }

    staff.phone = payload.phone;

    await Auth.findOneAndUpdate(
      { refModel: "Staff", refId: staff._id },
      { phone: payload.phone },
    );
  }

  if (payload.role !== undefined) {
    staff.role = payload.role;

    await Auth.findOneAndUpdate(
      { refModel: "Staff", refId: staff._id },
      { role: payload.role },
    );
  }

  if (payload.isActive !== undefined) {
    staff.isActive = payload.isActive;

    await Auth.findOneAndUpdate(
      { refModel: "Staff", refId: staff._id },
      { isActive: payload.isActive },
    );
  }

  await staff.save();

  return staff;
}

async function updateStaffStatus(id, isActive) {
  ensureValidObjectId(id);

  const staff = await Staff.findById(id);
  if (!staff) {
    throw new Error("Staff not found.");
  }

  staff.isActive = isActive;
  await staff.save();

  await Auth.findOneAndUpdate(
    { refModel: "Staff", refId: staff._id },
    { isActive },
  );

  return staff;
}

module.exports = {
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
};
