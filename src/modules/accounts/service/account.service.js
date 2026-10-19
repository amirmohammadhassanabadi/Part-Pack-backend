const mongoose = require("mongoose");
const Auth = require("../../auth/model/auth.model");
const Customer = require("../../customer/model/customer.model");
const Supplier = require("../../suppliers/model/supplier.model");
const Staff = require("../../staff/model/staff.model");
const { withTransaction } = require("../../../core/database/transaction");
const { mobilePattern, normalizeMobile } = require("../../../core/validation/phone");

const { pickProfileFields, completionStatus } = require("./profile-completion");

const models = { customer: Customer, supplier: Supplier, staff: Staff };
const kinds = { customer: "customer", supplier: "supplier", admin: "staff", operator: "staff" };
function fail(message, statusCode = 422) {
  throw Object.assign(new Error(message), { statusCode });
}
function identity(profile, kind) {
  return {
    name: kind === "supplier" ? profile.name : profile.fullName,
    phone: kind === "supplier" ? profile.contacts?.mobile : profile.phone,
    role: kind === "staff" ? profile.role : kind,
  };
}

async function ensurePhoneAvailable(phone, kind, profileId, authId, session) {
  if (await Auth.exists({ phone, ...(authId ? { _id: { $ne: authId } } : {}) }).session(session)) {
    fail("این شماره موبایل به حساب دیگری تعلق دارد.", 409);
  }
  for (const [otherKind, Model] of Object.entries(models)) {
    const field = otherKind === "supplier" ? "contacts.mobile" : "phone";
    const filter = { [field]: phone, ...(otherKind === kind && profileId ? { _id: { $ne: profileId } } : {}) };
    if (await Model.exists(filter).session(session)) fail("این شماره موبایل در پروفایل دیگری استفاده شده است.", 409);
  }
}

// Both documents commit together; a failed login-account write cannot leave a profile behind.
async function createAccount(kind, data) {
  const Model = models[kind];
  const profile = new Model({ ...data, ...(kind === "staff" ? {} : pickProfileFields(data, kind)) });
  await profile.validate();
  return withTransaction(async (session) => {
    await ensurePhoneAvailable(identity(profile, kind).phone, kind, null, null, session);
    const [saved] = await Model.create([profile.toObject()], { session });
    const { phone, role } = identity(saved, kind);
    await Auth.create([{ phone, role, refModel: Model.modelName, refId: saved._id, isActive: saved.isActive }], { session });
    return saved;
  }, { required: true });
}

async function updateAccount(kind, id, data, { repair = false } = {}) {
  const Model = models[kind];
  if (!Model || !mongoose.isValidObjectId(id)) fail("شناسه یا نوع کاربر نامعتبر است.", 400);
  return withTransaction(async (session) => {
    const profile = await Model.findById(id).session(session);
    if (!profile) fail("کاربر پیدا نشد.", 404);
    const accounts = await Auth.find({ refId: profile._id }).session(session);
    if (accounts.length > 1) fail("چند حساب ورود به این پروفایل متصل است؛ ابتدا ارتباط حساب‌ها بررسی شود.", 409);
    const account = accounts[0];
    if (account && (!kinds[account.role] || kinds[account.role] !== kind)) {
      fail("نقش حساب ورود با این پروفایل تعارض دارد؛ ارتباط حساب باید بررسی شود.", 409);
    }
    const extra = kind === "staff" ? {} : pickProfileFields(data, kind);
    for (const [field, value] of Object.entries(extra)) {
      if (["accessibility", "bankDetails"].includes(field)) {
        for (const [option, enabled] of Object.entries(value)) profile.set(`${field}.${option}`, enabled);
      } else profile.set(field, value);
    }
    const nameField = kind === "supplier" ? "name" : "fullName";
    const phoneField = kind === "supplier" ? "contacts.mobile" : "phone";
    for (const field of [nameField, "isActive", ...(kind === "supplier" ? ["address"] : []), ...(kind === "staff" ? ["role"] : [])]) {
      if (Object.hasOwn(data, field)) profile.set(field, data[field]);
    }
    const suppliedPhone = Object.hasOwn(data, "phone") ? data.phone
      : kind === "supplier" && Object.hasOwn(data.contacts || {}, "mobile") ? data.contacts.mobile : undefined;
    if (suppliedPhone !== undefined) profile.set(phoneField, suppliedPhone);
    // Only a linked account with the same role can supply a missing legacy mobile.
    if (!mobilePattern.test(profile.get(phoneField) || "") && suppliedPhone === undefined && mobilePattern.test(account?.phone || "")) {
      profile.set(phoneField, account.phone);
    }
    if (kind === "supplier") {
      for (const field of ["landLine", "telegram"]) {
        if (Object.hasOwn(data.contacts || {}, field)) profile.set(`contacts.${field}`, data.contacts[field]);
      }
    }
    await profile.validate([nameField, phoneField, "isActive", ...Object.keys(extra), ...(kind === "staff" ? ["role"] : [])]);
    if (!account && !repair) fail("حساب ورود این کاربر ناقص است؛ ادمین باید اطلاعات کاربر را تکمیل کند.");
    const { phone, role } = identity(profile, kind);
    await ensurePhoneAvailable(phone, kind, profile._id, account?._id, session);
    // Keep historical coverage separate from identity validation, but persist the identity repair.
    const updates = { [nameField]: profile.get(nameField), [phoneField]: phone, isActive: profile.isActive };
    for (const field of Object.keys(extra)) updates[field] = profile.get(field);
    if (kind !== "staff" && Object.hasOwn(data, "isActive")) updates.deactivatedAt = profile.isActive ? null : profile.deactivatedAt || new Date();
    if (kind === "staff") updates.role = profile.role;
    if (kind === "supplier") {
      for (const field of ["address", "contacts.landLine", "contacts.telegram"]) {
        if (profile.get(field) !== undefined) updates[field] = profile.get(field);
      }
    }
    await Model.updateOne({ _id: id }, { $set: updates }, { session, runValidators: true });
    const auth = account || new Auth();
    const wasActive = account?.isActive !== false;
    Object.assign(auth, { phone, role, refModel: Model.modelName, refId: profile._id, isActive: profile.isActive });
    if (account && wasActive && profile.isActive === false) auth.sessionVersion = (auth.sessionVersion || 0) + 1;
    await auth.save({ session });
    return Model.findById(id).session(session);
  }, { required: true });
}

// Do not validate or rewrite unrelated legacy fields when the owner closes an account.
async function deactivateOwnAccount(kind, id) {
  if (!["customer", "supplier"].includes(kind) || !mongoose.isValidObjectId(id)) fail("حساب نامعتبر است.", 400);
  return withTransaction(async (session) => {
    const profile = await models[kind].findById(id).session(session);
    if (!profile) fail("حساب پیدا نشد.", 404);
    const deactivatedAt = profile.deactivatedAt || new Date();
    await models[kind].updateOne({ _id: id }, { $set: { isActive: false, deactivatedAt } }, { session });
    // Incrementing the version invalidates every prior access and refresh token, even after an admin reactivates the account.
    await Auth.updateMany({ refId: profile._id, role: kind }, { $set: { isActive: false }, $inc: { sessionVersion: 1 } }, { session });
    return { success: true, deactivatedAt };
  }, { required: true });
}

// Read raw persisted fields: fallback display values must not hide incomplete records.
async function listAccounts() {
  const [customers, suppliers, staff, accounts] = await Promise.all([
    Customer.find().select("-orders -invoices").lean(), Supplier.find().lean(), Staff.find().lean(), Auth.find().lean(),
  ]);
  const profiles = [
    ...customers.map((profile) => ({ profile, kind: "customer" })),
    ...suppliers.map((profile) => ({ profile, kind: "supplier" })),
    ...staff.map((profile) => ({ profile, kind: "staff" })),
  ];
  const accountsByRef = new Map();
  const accountsByPhone = new Map();
  for (const account of accounts) {
    const key = String(account.refId);
    accountsByRef.set(key, [...(accountsByRef.get(key) || []), account]);
    accountsByPhone.set(account.phone, [...(accountsByPhone.get(account.phone) || []), account]);
  }
  const phoneCounts = new Map();
  for (const { profile, kind } of profiles) {
    const { phone } = identity(profile, kind);
    if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
  }
  const linked = new Set();
  const rows = profiles.map(({ profile, kind }) => {
    const { name, phone, role } = identity(profile, kind);
    const matching = accountsByRef.get(String(profile._id)) || [];
    matching.forEach((account) => linked.add(String(account._id)));
    const issues = [];
    const completion = completionStatus(profile, kind);
    issues.push(...completion.missingFields.map((field) => `${field} تکمیل نشده است.`));
    if (typeof name !== "string" || !name.trim()) issues.push("نام ثبت نشده یا نامعتبر است.");
    if (!mobilePattern.test(phone || "")) issues.push("شماره موبایل پروفایل ثبت نشده یا نامعتبر است.");
    if (typeof profile.isActive !== "boolean") issues.push("وضعیت فعال بودن پروفایل مشخص نیست.");
    if (kind === "staff" && !["admin", "operator"].includes(role)) issues.push("نقش پرسنل نامعتبر است.");
    if (!matching.length) issues.push("حساب ورود متصل وجود ندارد.");
    if (matching.length > 1) issues.push("چند حساب ورود به پروفایل متصل است.");
    for (const account of matching) {
      if (!kinds[account.role] || account.role !== role || account.refModel !== models[kind].modelName) issues.push("نقش یا ارتباط حساب ورود ناهماهنگ است.");
      if (!mobilePattern.test(account.phone || "") || account.phone !== phone) issues.push("موبایل حساب ورود با پروفایل ناهماهنگ است.");
      if (account.isActive !== profile.isActive) issues.push("وضعیت حساب ورود با پروفایل ناهماهنگ است.");
    }
    const duplicate = (accountsByPhone.get(phone) || []).some((account) => !matching.some((own) => String(own._id) === String(account._id)));
    if (duplicate) issues.push("این موبایل در حساب ورود دیگری استفاده شده است.");
    if ((phoneCounts.get(phone) || 0) > 1) issues.push("این موبایل در چند پروفایل استفاده شده است.");
    return { ...profile, fullName: name, phone, role, accountKind: kind,
      completion, loginPhone: matching.length === 1 ? matching[0].phone : "", integrity: { complete: !issues.length, issues: [...new Set(issues)] } };
  });
  for (const account of accounts) {
    if (linked.has(String(account._id))) continue;
    rows.push({ _id: account._id, role: account.role, phone: account.phone, isActive: account.isActive,
      accountKind: "orphan", refId: account.refId, fullName: "حساب ورود بدون پروفایل",
      integrity: { complete: false, issues: ["پروفایل متصل به این حساب ورود وجود ندارد؛ اطلاعات واقعی کاربر باید تکمیل شود."] } });
  }
  return rows;
}

async function repairOrphan(id, data) {
  if (!mongoose.isValidObjectId(id)) fail("شناسه نامعتبر است.", 400);
  return withTransaction(async (session) => {
    const account = await Auth.findById(id).session(session);
    if (!account) fail("حساب ورود پیدا نشد.", 404);
    const kind = kinds[account.role];
    const Model = models[kind];
    if (!Model) fail("نقش حساب نامعتبر است؛ ارتباط حساب باید بررسی شود.", 409);
    // Never replace an existing profile or silently attach a phone to someone else's profile.
    if (account.refId) {
      for (const model of Object.values(models)) {
        if (await model.exists({ _id: account.refId }).session(session)) fail("پروفایل این حساب موجود است؛ اطلاعات همان پروفایل را ویرایش کنید.", 409);
      }
    }
    const phone = normalizeMobile(data.phone);
    const profileData = kind === "supplier" ? { name: data.fullName, contacts: { mobile: phone } }
      : { fullName: data.fullName, phone, ...(kind === "staff" ? { role: account.role } : {}) };
    await ensurePhoneAvailable(phone, kind, null, account._id, session);
    const [profile] = await Model.create([{ ...profileData, ...(kind === "staff" ? {} : pickProfileFields(data, kind)), ...(account.refId ? { _id: account.refId } : {}), isActive: account.isActive }], { session });
    Object.assign(account, { phone, refId: profile._id, refModel: Model.modelName });
    await account.save({ session });
    return profile;
  }, { required: true });
}

async function assertAccountReady(account) {
  const kind = kinds[account.role];
  const Model = models[kind];
  if (!Model || !account.refId || account.refModel !== Model.modelName) fail("اطلاعات حساب ناقص است؛ با ادمین برای تکمیل حساب تماس بگیرید.", 403);
  const profile = await Model.findById(account.refId).lean();
  const details = profile && identity(profile, kind);
  // Missing personal data is repaired after login. A valid mobile belonging to
  // someone else, an inactive profile or a broken role/reference is not repairable by the user.
  const selfService = ["customer", "supplier"].includes(account.role);
  const validProfilePhone = mobilePattern.test(details?.phone || "");
  if (!profile?.isActive || !mobilePattern.test(account.phone || "") || details.role !== account.role
    || (validProfilePhone && details.phone !== account.phone)
    || (!selfService && (!String(details.name || "").trim() || !validProfilePhone))) {
    fail("اطلاعات حساب ناقص یا ناهماهنگ است؛ با ادمین برای بررسی حساب تماس بگیرید.", 403);
  }
}

module.exports = { deactivateOwnAccount, createAccount, updateAccount, listAccounts, repairOrphan, assertAccountReady };
