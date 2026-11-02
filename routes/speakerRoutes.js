const express = require("express");
const { applyAsSpeaker, getMySpeakerApplications } = require("../controllers/speakerController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/apply", requireAuth, applyAsSpeaker);
router.get("/mine", requireAuth, getMySpeakerApplications);

module.exports = router;
