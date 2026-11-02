const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // "Early Bird" | "Regular" | "Door"
    price: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    quantityCap: { type: Number, required: true },
    quantitySold: { type: Number, default: 0 },
  },
  { _id: false }
);

const ticketTypeSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true }, // "General Admission" | "VIP"
    description: { type: String },
    phases: {
      type: [phaseSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
  },
  { timestamps: true }
);

// Returns the phase that is currently active based on today's date,
// falling through to the next phase if the current one is sold out.
ticketTypeSchema.methods.getActivePhase = function () {
  const now = new Date();
  const candidates = this.phases
    .filter((p) => now >= p.startDate && now <= p.endDate)
    .sort((a, b) => a.startDate - b.startDate);

  for (const phase of candidates) {
    if (phase.quantitySold < phase.quantityCap) return phase;
  }

  // Current phase(s) sold out — fall through to the next phase that hasn't started selling out yet
  const upcoming = this.phases
    .filter((p) => now < p.startDate)
    .sort((a, b) => a.startDate - b.startDate);
  return upcoming[0] || null;
};

module.exports = mongoose.model("TicketType", ticketTypeSchema);
