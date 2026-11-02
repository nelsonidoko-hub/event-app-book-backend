const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const Sponsor = require("../models/Sponsor");
const Speaker = require("../models/Speaker");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { sendApplicationStatusEmail } = require("../utils/email");

const MODEL_MAP = { vendor: Vendor, sponsor: Sponsor, speaker: Speaker };

const listOrders = asyncHandler(async (req, res) => {
  const { orderType, status } = req.query;
  const filter = {};
  if (orderType) filter.orderType = orderType;
  if (status) filter.status = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("userId", "name email");
  res.json({ orders });
});

const listApplications = asyncHandler(async (req, res) => {
  const { type, status } = req.query; // type: vendor | sponsor | speaker
  if (type && !MODEL_MAP[type]) throw new AppError("Invalid application type", 400);

  const types = type ? [type] : Object.keys(MODEL_MAP);
  const results = {};
  for (const t of types) {
    const filter = status ? { applicationStatus: status } : {};
    results[t] = await MODEL_MAP[t].find(filter).populate("userId", "name email");
  }

  res.json(results);
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body; // "approved" | "rejected"

  if (!MODEL_MAP[type]) throw new AppError("Invalid application type", 400);
  if (!["approved", "rejected"].includes(status)) throw new AppError("Invalid status", 400);

  const application = await MODEL_MAP[type].findByIdAndUpdate(
    id,
    { applicationStatus: status },
    { new: true }
  );
  if (!application) throw new AppError("Application not found", 404);

  const user = await User.findById(application.userId);
  if (user) await sendApplicationStatusEmail(user, type, status);

  res.json({ application });
});

const getAnalytics = asyncHandler(async (_req, res) => {
  const [ticketRevenue, productRevenue, ticketsSold, pendingApplications] = await Promise.all([
    Order.aggregate([
      { $match: { status: "paid", orderType: { $in: ["ticket", "mixed"] } } },
      { $unwind: "$items" },
      { $match: { "items.itemType": "ticket" } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } } } },
    ]),
    Order.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$items" },
      { $match: { "items.itemType": "product" } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } } } },
    ]),
    Ticket.countDocuments(),
    Promise.all(
      Object.entries(MODEL_MAP).map(async ([type, Model]) => ({
        type,
        count: await Model.countDocuments({ applicationStatus: "pending" }),
      }))
    ),
  ]);

  res.json({
    ticketRevenue: ticketRevenue[0]?.total || 0,
    productRevenue: productRevenue[0]?.total || 0,
    ticketsSold,
    pendingApplications,
  });
});

// Scans a ticket's QR token and marks it checked in. Rejects already-used tickets.
const checkInTicket = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  if (!qrCode) throw new AppError("qrCode is required", 400);

  const ticket = await Ticket.findOne({ qrCode });
  if (!ticket) throw new AppError("Ticket not found — invalid QR code", 404);
  if (ticket.checkedIn) {
    throw new AppError(`Ticket already checked in at ${ticket.checkedInAt.toISOString()}`, 409);
  }

  ticket.checkedIn = true;
  ticket.checkedInAt = new Date();
  await ticket.save();

  res.json({ success: true, attendeeName: ticket.attendeeName });
});

module.exports = {
  listOrders,
  listApplications,
  updateApplicationStatus,
  getAnalytics,
  checkInTicket,
};
