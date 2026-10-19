const mongoose = require("mongoose");
const { bankFields, pickBankDetails } = require("./bank-details");

const normalizeDigits = (value) => typeof value === "string" ? value.trim().replace(/[۰-۹٠-٩]/g,
  (digit) => String(digit.charCodeAt(0) >= 0x06f0 ? digit.charCodeAt(0) - 0x06f0 : digit.charCodeAt(0) - 0x0660)) : value;
function validNationalCode(value) {
  const code = normalizeDigits(value);
  if (typeof code !== "string" || !/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
  const sum = [...code.slice(0, 9)].reduce((total, digit, index) => total + Number(digit) * (10 - index), 0) % 11;
  return Number(code[9]) === (sum < 2 ? sum : 11 - sum);
}
function validEconomicCode(value) {
  const code = normalizeDigits(value);
  return typeof code === "string" && /^(?:\d{12}|\d{14})$/.test(code) && !/^(\d)\1+$/.test(code);
}
const profileFields = ["personType", "nationalCode", "economicCode", "email", "birthDate", "accessibility", "bankDetails"];
function identityFields() {
  return {
    bankDetails: bankFields(),
    deactivatedAt: { type: Date, default: null },
    personType: { type: String, enum: ["individual", "legal"], default: "individual" },
    nationalCode: { type: String, set: normalizeDigits, validate: { validator: (v) => !v || validNationalCode(v), message: "کد ملی معتبر نیست." } },
    economicCode: { type: String, set: normalizeDigits, validate: { validator: (v) => !v || validEconomicCode(v), message: "کد اقتصادی باید ۱۲ یا ۱۴ رقم باشد." } },
    email: { type: String, trim: true, lowercase: true, validate: { validator: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: "ایمیل معتبر نیست." } },
    birthDate: { type: String, trim: true, validate: { validator: (v) => !v || /^\d{4}[/-](0[1-9]|1[0-2])[/-](0[1-9]|[12]\d|3[01])$/.test(v), message: "تاریخ را به صورت ۱۳۷۰/۰۱/۰۱ وارد کنید." }, set: normalizeDigits },
    accessibility: {
      wheelchair: { type: Boolean, default: false },
      visualImpairment: { type: Boolean, default: false },
      hearingImpairment: { type: Boolean, default: false },
    },
  };
}
function completionStatus(profile, kind) {
  if (!["customer", "supplier"].includes(kind)) return { complete: true, missingFields: [] };
  const missingFields = [];
  const name = kind === "supplier" ? profile?.name : profile?.fullName;
  const phone = kind === "supplier" ? profile?.contacts?.mobile : profile?.phone;
  if (typeof name !== "string" || !name.trim()) missingFields.push("نام و نام خانوادگی یا نام مجموعه");
  if (!/^09\d{9}$/.test(phone || "")) missingFields.push("شماره موبایل");
  const personType = profile?.personType || "individual";
  if (!["individual", "legal"].includes(personType) || (kind === "customer" && personType !== "individual")) missingFields.push("نوع شخص");
  if (kind === "supplier" && personType === "legal") {
    if (!validEconomicCode(profile?.economicCode)) missingFields.push("کد اقتصادی");
  } else if (!validNationalCode(profile?.nationalCode)) missingFields.push("کد ملی");
  return { complete: missingFields.length === 0, missingFields };
}
function pickProfileFields(data, kind) {
  const fields = {};
  for (const key of profileFields) {
    if (!Object.hasOwn(data, key)) continue;
    if (key === "bankDetails") {
      fields[key] = pickBankDetails(data[key]);
    } else if (key === "accessibility") {
      if (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key])) throw Object.assign(new Error("گزینه‌های دسترسی‌پذیری نامعتبر است."), { statusCode: 422 });
      fields[key] = {};
      for (const option of ["wheelchair", "visualImpairment", "hearingImpairment"]) {
        if (data[key][option] !== undefined) {
          if (typeof data[key][option] !== "boolean") throw Object.assign(new Error("گزینه‌های دسترسی‌پذیری باید روشن یا خاموش باشند."), { statusCode: 422 });
          fields[key][option] = data[key][option];
        }
      }
    } else {
      if (typeof data[key] !== "string") throw Object.assign(new Error("اطلاعات هویتی باید متنی باشد."), { statusCode: 422 });
      fields[key] = normalizeDigits(data[key]);
    }
  }
  if (kind === "customer" && fields.personType && fields.personType !== "individual") throw Object.assign(new Error("حساب مشتری از نوع حقیقی است."), { statusCode: 422 });
  return fields;
}
async function requireCompleteProfile(kind, id) {
  const Model = kind === "supplier" ? require("../../suppliers/model/supplier.model") : require("../../customer/model/customer.model");
  const profile = mongoose.isValidObjectId(id) ? await Model.findById(id).lean() : null;
  const completion = completionStatus(profile, kind);
  if (!completion.complete || !profile?.isActive) {
    throw Object.assign(new Error("برای ادامه، اطلاعات حساب کاربری خود را تکمیل کنید."), {
      statusCode: 403, code: "PROFILE_INCOMPLETE", errors: completion.missingFields.map((field) => ({ field, message: `${field} را تکمیل کنید.` })),
    });
  }
  return profile;
}
module.exports = { identityFields, profileFields, completionStatus, pickProfileFields, validNationalCode, validEconomicCode, requireCompleteProfile };
