const router = require("express").Router();
const service = require("./service/bundle.service");
const { authenticate, authorize } = require("../auth/middleware/auth.middleware");
const endpoint = (work, status = 200) => async (req, res, next) => {
  try { res.status(status).json({ success: true, data: await work(req) }); }
  catch (error) { next(error); }
};
router.get("/", endpoint((req) => service.listBundles({ featured: req.query.featured === "true" })));
router.get("/admin", authenticate, authorize("admin"), endpoint(() => service.listBundles({ admin: true })));
router.get("/:id", endpoint((req) => service.getBundle(req.params.id)));
router.post("/", authenticate, authorize("admin"), endpoint((req) => service.createBundle(req.body), 201));
router.put("/:id", authenticate, authorize("admin"), endpoint((req) => service.updateBundle(req.params.id, req.body)));
router.delete("/:id", authenticate, authorize("admin"), endpoint((req) => service.deactivateBundle(req.params.id)));
module.exports = router;
