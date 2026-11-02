const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    businessName: { type: String, required: true },
    description: { type: String },
    website: { type: String },
    boothTier: { type: String }, // e.g. "Standard 10x10", "Premium 10x20"
    boothPrice: { type: Number },
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

module.exports = mongoose.model("Vendor", vendorSchema);
