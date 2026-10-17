const mongoose = require("mongoose");
const Staff = require("../model/staff.model");
const { createAccount, updateAccount } = require("../../accounts/service/account.service");

async function createStaff(data) {
  return createAccount("staff", data);
}

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
  return updateAccount("staff", id, payload);
}

async function updateStaffStatus(id, isActive) {
  return updateAccount("staff", id, { isActive });
}

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
};
