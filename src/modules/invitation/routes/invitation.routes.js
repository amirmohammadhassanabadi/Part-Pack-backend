const express = require("express");
const invitationController = require("../controller/invitation.controller");

const router = express.Router();
router.get("/:token", invitationController.getSupplierInvitation);
router.post("/:token/items/:itemKey/offers", invitationController.addOffer);
router.patch("/:token/items/:itemKey/offers/:offerId", invitationController.updateOffer);
router.delete("/:token/items/:itemKey/offers/:offerId", invitationController.deleteOffer);

module.exports = router;