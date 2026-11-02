const Event = require("../models/Event");
const TicketType = require("../models/TicketType");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

const listEvents = asyncHandler(async (_req, res) => {
  const events = await Event.find().sort({ startDate: 1 });
  res.json({ events });
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) throw new AppError("Event not found", 404);
  res.json({ event });
});

// Public endpoint: returns each ticket type with its currently active phase/price
// so the frontend never has to duplicate the phase-selection logic in JS.
const getTicketTypesForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) throw new AppError("Event not found", 404);

  const ticketTypes = await TicketType.find({ eventId: event._id });

  const withActivePhase = ticketTypes.map((tt) => {
    const activePhase = tt.getActivePhase();
    return {
      _id: tt._id,
      name: tt.name,
      description: tt.description,
      activePhase,
      soldOut: !activePhase,
    };
  });

  res.json({ ticketTypes: withActivePhase });
});

// Admin only — create/update below

const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create(req.body);
  res.status(201).json({ event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) throw new AppError("Event not found", 404);
  res.json({ event });
});

module.exports = { listEvents, getEvent, getTicketTypesForEvent, createEvent, updateEvent };
