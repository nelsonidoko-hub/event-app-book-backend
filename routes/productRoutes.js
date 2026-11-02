const express = require("express");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
} = require("../controllers/productController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Public
router.get("/", listProducts);
router.get("/:id", getProduct);

// Admin only
router.post("/", requireAuth, requireRole("admin"), createProduct);
router.patch("/:id", requireAuth, requireRole("admin"), updateProduct);

module.exports = router;
