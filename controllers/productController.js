const Product = require("../models/Product");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

const listProducts = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { active: true };
  if (category) filter.category = category;

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.active) throw new AppError("Product not found", 404);
  res.json({ product });
});

// Admin only
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ product });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct };
