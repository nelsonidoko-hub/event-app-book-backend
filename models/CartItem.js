const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    // Either userId (logged in) or sessionId (guest) will be set
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    itemType: { type: String, enum: ["ticket", "product"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId }, // for products with size variants
    quantity: { type: Number, required: true, min: 1, default: 1 },
    // Snapshot fields so a cart line still displays sensibly even if price changes later
    nameSnapshot: { type: String },
    priceSnapshot: { type: Number },
  },
  { timestamps: true }
);

cartItemSchema.index({ userId: 1 });
cartItemSchema.index({ sessionId: 1 });

module.exports = mongoose.model("CartItem", cartItemSchema);
