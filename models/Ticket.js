const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    qrCode: { type: String, required: true, unique: true }, // unique token encoded in the QR image
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
