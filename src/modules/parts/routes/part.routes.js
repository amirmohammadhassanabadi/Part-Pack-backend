const express = require("express");
const partController = require("../controllers/part.controller");

const router = express.Router();

router.get("/search", partController.searchParts);

router.post("/", partController.createPart);

router.get("/", partController.getParts);

router.get("/:id", partController.getPartById);

router.patch("/:id", partController.updatePart);

router.delete("/:id", partController.deletePart);

module.exports = router;
