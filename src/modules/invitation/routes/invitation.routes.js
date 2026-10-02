const express = require("express");
const invitationController = require("../controller/invitation.controller");
const { validateBody, validateOffer } = require("../../../core/validation/validate");

const router = express.Router();
router.get("/:token", invitationController.getSupplierInvitation);
router.post("/:token/items/:itemKey/offers", validateBody(validateOffer), invitationController.addOffer);
router.patch("/:token/items/:itemKey/offers/:offerId", validateBody(validateOffer), invitationController.updateOffer);
router.delete("/:token/items/:itemKey/offers/:offerId", invitationController.deleteOffer);

module.exports = router;
