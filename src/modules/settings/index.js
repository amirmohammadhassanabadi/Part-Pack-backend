const express = require("express");
const mongoose = require("mongoose");
const { authenticate, authorize } = require("../auth/middleware/auth.middleware");
const schema = new mongoose.Schema({ _id: String, otpPreviewEnabled: { type: Boolean, default: true }, revision: { type: Number, default: 0 }, updatedBy: mongoose.Schema.Types.ObjectId }, { timestamps: true });
const Settings = mongoose.models.SystemSettings || mongoose.model("SystemSettings", schema);
async function getAuthSettings() {
  const settings = await Settings.findById("authentication").lean();
  return { otpPreviewEnabled: settings?.otpPreviewEnabled ?? true, revision: settings?.revision || 0 };
}
const router = express.Router();
router.use(authenticate, authorize("admin"));
router.get("/authentication", async (req, res, next) => {
  try { res.set("Cache-Control", "no-store").json(await getAuthSettings()); } catch (error) { next(error); }
});
router.patch("/authentication", async (req, res, next) => {
  try {
    if (typeof req.body.otpPreviewEnabled !== "boolean") return res.status(400).json({ message: "وضعیت نمایش کد باید مشخص باشد." });
    const settings = await Settings.findOneAndUpdate({ _id: "authentication" }, { $set: { otpPreviewEnabled: req.body.otpPreviewEnabled, updatedBy: req.user.userId }, $inc: { revision: 1 } }, { upsert: true, returnDocument: "after", runValidators: true });
    res.set("Cache-Control", "no-store").json({ otpPreviewEnabled: settings.otpPreviewEnabled, revision: settings.revision });
  } catch (error) { next(error); }
});
module.exports = router;
module.exports.getAuthSettings = getAuthSettings;
