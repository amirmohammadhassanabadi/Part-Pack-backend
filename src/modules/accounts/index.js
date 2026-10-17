const express = require("express");
const { authenticate, authorize } = require("../auth/middleware/auth.middleware");
const service = require("./service/account.service");
const router = express.Router();

router.use(authenticate, authorize("admin"));
router.get("/", async (req, res, next) => {
  try { res.json(await service.listAccounts()); } catch (error) { next(error); }
});
router.patch("/:kind/:id", async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    const data = { ...req.body };
    if (kind === "supplier" && Object.hasOwn(data, "fullName")) data.name = data.fullName;
    const profile = kind === "orphan" ? await service.repairOrphan(id, data)
      : await service.updateAccount(kind, id, data, { repair: true });
    res.json(profile);
  } catch (error) { next(error); }
});

module.exports = router;
