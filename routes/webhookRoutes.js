const express = require("express");
const { stripeWebhook } = require("../controllers/webhookController");

const router = express.Router();

// NOTE: express.raw() is applied to this exact path in server.js, before
// this router is mounted, so req.body here is a raw Buffer (required for
// Stripe signature verification) rather than the globally JSON-parsed body.
router.post("/stripe", stripeWebhook);

module.exports = router;
