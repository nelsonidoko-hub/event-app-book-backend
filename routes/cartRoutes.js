const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  mergeGuestCart,
} = require("../controllers/cartController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

// Cart works for guests (via x-session-id header) and logged-in users alike
router.get("/", optionalAuth, getCart);
router.post("/add", optionalAuth, addToCart);
router.patch("/:id", optionalAuth, updateCartItem);
router.delete("/:id", optionalAuth, removeCartItem);

// Called right after login to fold a guest cart into the user's account
router.post("/merge", requireAuth, mergeGuestCart);

module.exports = router;
