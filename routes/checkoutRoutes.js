const express = require("express");
const { createCheckoutSession } = require("../controllers/checkoutController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/create-session", optionalAuth, createCheckoutSession);

module.exports = router;
