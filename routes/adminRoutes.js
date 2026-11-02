const express = require("express");
const {
  listOrders,
  listApplications,
  updateApplicationStatus,
  getAnalytics,
  checkInTicket,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Every route here requires a logged-in admin
router.use(requireAuth, requireRole("admin"));

router.get("/orders", listOrders);
router.get("/applications", listApplications);
router.patch("/applications/:type/:id", updateApplicationStatus);
router.get("/analytics", getAnalytics);
router.post("/checkin", checkInTicket);

module.exports = router;
