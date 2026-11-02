const mongoose = require("mongoose");

const sponsorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    companyName: { type: String, required: true },
    website: { type: String },
    sponsorshipTier: { type: String }, // e.g. "Bronze", "Silver", "Gold"
    amount: { type: Number },
    logoUrl: { type: String },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    paid: { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sponsor", sponsorSchema);
