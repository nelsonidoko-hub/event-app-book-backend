const express = require("express");
const { applyAsSponsor, getMySponsorApplications } = require("../controllers/sponsorController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/apply", requireAuth, applyAsSponsor);
router.get("/mine", requireAuth, getMySponsorApplications);

module.exports = router;
