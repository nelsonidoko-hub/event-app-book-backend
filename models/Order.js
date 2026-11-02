const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ["ticket", "product"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true }, // snapshot at time of purchase
    phaseLabel: { type: String }, // for tickets — which pricing phase was bought
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestEmail: { type: String }, // for guest checkout
    items: { type: [orderItemSchema], required: true },
    orderType: {
      type: String,
      enum: ["ticket", "product", "mixed", "booth", "sponsorship"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    // Orders auto-expire out of "pending" if payment never completes.
    // MongoDB TTL index cleans these up (see index below).
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically removes documents once expiresAt is in the past.
// Only meaningful while status stays "pending" — cleared/unset once paid (handled in controller).
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Order", orderSchema);
