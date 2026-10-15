const invitationService = require("../service/invitation.service");

async function getSupplierInvitation(req, res, next) {
  try {
    const invitation = await invitationService.getSupplierInvitation(
      req.params.token || req.params.invitationId,
      req.params.invitationId ? req.user.userId : null,
    );
    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

async function addOffer(req, res, next) {
  try {
    const result = await invitationService.addOffer(
      req.params.token || req.params.invitationId,
      req.params.itemKey,
      req.body,
      req.params.invitationId ? req.user.userId : null,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function updateOffer(req, res, next) {
  try {
    const result = await invitationService.updateOffer(
      req.params.token || req.params.invitationId,
      req.params.itemKey,
      req.params.offerId,
      req.body,
      req.params.invitationId ? req.user.userId : null,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteOffer(req, res, next) {
  try {
    const invitation = await invitationService.deleteOffer(
      req.params.token || req.params.invitationId,
      req.params.itemKey,
      req.params.offerId,
      req.params.invitationId ? req.user.userId : null,
    );
    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
}

async function listSupplierInvitations(req, res, next) {
  try {
    const result = await invitationService.listSupplierInvitations(req.user.userId, req.query);
    res.status(200).json({ success: true, data: result.invitations, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

module.exports = { getSupplierInvitation, addOffer, updateOffer, deleteOffer, listSupplierInvitations };
