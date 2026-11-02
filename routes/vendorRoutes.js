const express = require("express");
const { applyAsVendor, getMyVendorApplications } = require("../controllers/vendorController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/apply", requireAuth, applyAsVendor);
router.get("/mine", requireAuth, getMyVendorApplications);

module.exports = router;
