const invitationService = require("../service/invitation.service");

async function getSupplierInvitation(req, res, next) {
  try {
    const invitation = await invitationService.getSupplierInvitation(
      req.params.token,
    );
    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

async function addOffer(req, res, next) {
  try {
    const result = await invitationService.addOffer(
      req.params.token,
      req.params.itemKey,
      req.body,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function updateOffer(req, res, next) {
  try {
    const result = await invitationService.updateOffer(
      req.params.token,
      req.params.itemKey,
      req.params.offerId,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteOffer(req, res, next) {
  try {
    const invitation = await invitationService.deleteOffer(
      req.params.token,
      req.params.itemKey,
      req.params.offerId,
    );
    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

module.exports = { getSupplierInvitation, addOffer, updateOffer, deleteOffer };
