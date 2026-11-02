const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    size: { type: String }, // e.g. "S", "M", "L" — omit for non-apparel
    sku: { type: String },
    stockQuantity: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    category: { type: String, enum: ["book", "apparel", "merch", "other"], default: "other" },
    variants: { type: [variantSchema], default: [] },
    // For products without size/variant tracking, use this instead
    stockQuantity: { type: Number },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
