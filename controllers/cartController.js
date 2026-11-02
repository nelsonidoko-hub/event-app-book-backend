const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const TicketType = require("../models/TicketType");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

// Resolves the cart "owner" — logged-in userId takes priority, otherwise
// falls back to a client-generated guest session id sent in a header.
function getCartOwnerFilter(req) {
  if (req.user) return { userId: req.user._id };
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) throw new AppError("Missing x-session-id header for guest cart", 400);
  return { sessionId };
}

// Re-fetches live price/name for each cart line so the response is always accurate,
// even if a product's price changed or a ticket phase advanced since the item was added.
async function hydrateCartItems(items) {
  const hydrated = [];
  for (const item of items) {
    if (item.itemType === "product") {
      const product = await Product.findById(item.itemId);
      if (!product || !product.active) continue; // silently drop items that no longer exist
      hydrated.push({
        cartItemId: item._id,
        itemType: "product",
        itemId: product._id,
        variantId: item.variantId,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      });
    } else if (item.itemType === "ticket") {
      const ticketType = await TicketType.findById(item.itemId);
      if (!ticketType) continue;
      const activePhase = ticketType.getActivePhase();
      hydrated.push({
        cartItemId: item._id,
        itemType: "ticket",
        itemId: ticketType._id,
        name: ticketType.name,
        phaseLabel: activePhase?.label || null,
        unitPrice: activePhase?.price ?? null,
        soldOut: !activePhase,
        quantity: item.quantity,
      });
    }
  }
  return hydrated;
}

const getCart = asyncHandler(async (req, res) => {
  const ownerFilter = getCartOwnerFilter(req);
  const items = await CartItem.find(ownerFilter);
  const hydrated = await hydrateCartItems(items);
  const total = hydrated.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
  res.json({ items: hydrated, total });
});

const addToCart = asyncHandler(async (req, res) => {
  const ownerFilter = getCartOwnerFilter(req);
  const { itemType, itemId, variantId, quantity = 1 } = req.body;

  if (!["product", "ticket"].includes(itemType)) {
    throw new AppError("itemType must be 'product' or 'ticket'", 400);
  }

  // Validate the item exists and (for tickets) is currently sellable
  if (itemType === "product") {
    const product = await Product.findById(itemId);
    if (!product || !product.active) throw new AppError("Product not found", 404);
  } else {
    const ticketType = await TicketType.findById(itemId);
    if (!ticketType) throw new AppError("Ticket type not found", 404);
    if (!ticketType.getActivePhase()) throw new AppError("This ticket is sold out", 409);
  }

  let cartItem = await CartItem.findOne({ ...ownerFilter, itemType, itemId, variantId: variantId || null });
  if (cartItem) {
    cartItem.quantity += quantity;
    await cartItem.save();
  } else {
    cartItem = await CartItem.create({ ...ownerFilter, itemType, itemId, variantId, quantity });
  }

  res.status(201).json({ cartItem });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const ownerFilter = getCartOwnerFilter(req);
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new AppError("quantity must be >= 1", 400);

  const cartItem = await CartItem.findOneAndUpdate(
    { _id: req.params.id, ...ownerFilter },
    { quantity },
    { new: true }
  );
  if (!cartItem) throw new AppError("Cart item not found", 404);

  res.json({ cartItem });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const ownerFilter = getCartOwnerFilter(req);
  const result = await CartItem.findOneAndDelete({ _id: req.params.id, ...ownerFilter });
  if (!result) throw new AppError("Cart item not found", 404);
  res.json({ success: true });
});

// Called after login to move a guest's cart onto their account.
const mergeGuestCart = asyncHandler(async (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) return res.json({ merged: 0 });

  const result = await CartItem.updateMany(
    { sessionId },
    { $set: { userId: req.user._id }, $unset: { sessionId: "" } }
  );
  res.json({ merged: result.modifiedCount });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, mergeGuestCart };
