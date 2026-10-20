const express = require("express");
const { authenticate, authorize } = require("../auth/middleware/auth.middleware");
const service = require("./service/account.service");
const router = express.Router();

const { completionStatus, pickProfileFields } = require("./service/profile-completion");
const profileModel = (role) => role === "supplier" ? require("../suppliers/model/supplier.model") : require("../customer/model/customer.model");
router.get("/me/profile", authenticate, authorize("customer", "supplier"), async (req, res, next) => {
  try {
    const profile = await profileModel(req.user.role).findById(req.user.userId).select("-orders -invoices -coverageRules -stats -balance").lean();
    if (!profile) return res.status(404).json({ message: "پروفایل کاربر یافت نشد." });
    res.set("Cache-Control", "no-store").json({ profile, completion: completionStatus(profile, req.user.role) });
  } catch (error) { next(error); }
});
router.patch("/me/profile", authenticate, authorize("customer", "supplier"), async (req, res, next) => {
  try {
    const kind = req.user.role;
    const data = pickProfileFields(req.body, kind);
    const nameField = kind === "supplier" ? "name" : "fullName";
    if (Object.hasOwn(req.body, nameField)) data[nameField] = req.body[nameField];
    if (kind === "supplier" && Object.hasOwn(req.body, "address")) data.address = req.body.address;
    // Login mobile and activation can only be changed through the admin account flow.
    const profile = await service.updateAccount(kind, req.user.userId, data);
    res.json({ profile, completion: completionStatus(profile, kind) });
  } catch (error) { next(error); }
});
router.delete("/me", authenticate, authorize("customer", "supplier"), async (req, res, next) => {
  try {
    if (req.body?.confirm !== true) return res.status(400).json({ message: "تأیید حذف حساب الزامی است." });
    res.json(await service.deactivateOwnAccount(req.user.role, req.user.userId));
  } catch (error) { next(error); }
});
router.use(authenticate, authorize("admin", "operator"));
router.get("/", async (req, res, next) => {
  try { res.json(await service.listAccounts(req.user.role === "admin" ? undefined : [ ...(req.user.permissions.includes("sales") ? ["customer"] : []), ...(req.user.permissions.includes("supply") ? ["supplier"] : []) ])); } catch (error) { next(error); }
});
router.patch("/:kind/:id", async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    if (req.user.role !== "admin" && !((kind === "customer" && req.user.permissions.includes("sales")) || (kind === "supplier" && req.user.permissions.includes("supply")))) return res.status(403).json({ message: "دسترسی ندارید." });
    const data = { ...req.body };
    if (kind === "supplier" && Object.hasOwn(data, "fullName")) data.name = data.fullName;
    const profile = kind === "orphan" ? await service.repairOrphan(id, data)
      : await service.updateAccount(kind, id, data, { repair: true });
    res.json(profile);
  } catch (error) { next(error); }
});

module.exports = router;
