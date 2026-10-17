const express = require("express");
const supplierController = require("../controller/supplier.controller");
const { authenticate, authorize } = require("../../auth/middleware/auth.middleware");

const invitationController = require("../../invitation/controller/invitation.controller");
const { validateBody, validateOffer } = require("../../../core/validation/validate");

const router = express.Router();

router.get("/me/profile", authenticate, authorize("supplier"), supplierController.getMyProfile);
router.patch("/me/profile", authenticate, authorize("supplier"), supplierController.updateMyProfile);
router.get("/me/coverage", authenticate, authorize("supplier"), supplierController.getMyCoverage);
router.post("/me/coverage", authenticate, authorize("supplier"), supplierController.addMyCoverage);
router.put("/me/coverage/:coverageId", authenticate, authorize("supplier"), supplierController.replaceMyCoverage);
router.delete("/me/coverage/:coverageId", authenticate, authorize("supplier"), supplierController.removeMyCoverage);

router.get(
  "/me/invitations",
  authenticate,
  authorize("supplier"),
  invitationController.listSupplierInvitations,
);
router.get(
  "/me/invitations/:invitationId",
  authenticate,
  authorize("supplier"),
  invitationController.getSupplierInvitation,
);
router.post(
  "/me/invitations/:invitationId/items/:itemKey/offers",
  authenticate,
  authorize("supplier"),
  validateBody(validateOffer),
  invitationController.addOffer,
);
router.patch(
  "/me/invitations/:invitationId/items/:itemKey/offers/:offerId",
  authenticate,
  authorize("supplier"),
  validateBody(validateOffer),
  invitationController.updateOffer,
);
router.delete(
  "/me/invitations/:invitationId/items/:itemKey/offers/:offerId",
  authenticate,
  authorize("supplier"),
  invitationController.deleteOffer,
);

router.get(
  "/:id/coverage",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getCoverage,
);
router.post(
  "/",
  authenticate,
  authorize("admin", "operator"),
  supplierController.createSupplier,
);
router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getSuppliers,
);
router.get(
  "/matching/order-item",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getMatchingSuppliersForOrderItem,
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  supplierController.getSupplierById,
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  supplierController.updateSupplier,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  supplierController.deleteSupplier,
);

router.post(
  "/:id/coverage",
  authenticate,
  authorize("admin", "operator"),
  supplierController.addCoverage,
);
router.put(
  "/:id/coverage/:coverageId",
  authenticate,
  authorize("admin", "operator"),
  supplierController.replaceCoverage,
);
router.delete(
  "/:id/coverage/:coverageId",
  authenticate,
  authorize("admin", "operator"),
  supplierController.removeCoverage,
);

module.exports = router;
