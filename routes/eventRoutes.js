const express = require("express");
const {
  listEvents,
  getEvent,
  getTicketTypesForEvent,
  createEvent,
  updateEvent,
} = require("../controllers/eventController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Public
router.get("/", listEvents);
router.get("/:slug", getEvent);
router.get("/:slug/ticket-types", getTicketTypesForEvent);

// Admin only
router.post("/", requireAuth, requireRole("admin"), createEvent);
router.patch("/:id", requireAuth, requireRole("admin"), updateEvent);

module.exports = router;
