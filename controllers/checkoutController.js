const mongoose = require("mongoose");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const TicketType = require("../models/TicketType");
const Order = require("../models/Order");
const stripe = require("../utils/stripe");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

function getCartOwnerFilter(req) {
  if (req.user) return { userId: req.user._id };
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) throw new AppError("Missing x-session-id header for guest cart", 400);
  return { sessionId };
}

// Creates a Stripe Checkout Session from the current cart.
// Re-validates every item's availability at the DB level right before
// creating the session — never trust prices/stock the client already saw.
const createCheckoutSession = asyncHandler(async (req, res) => {
  const ownerFilter = getCartOwnerFilter(req);
  const { guestEmail } = req.body;

  if (!req.user && !guestEmail) {
    throw new AppError("guestEmail is required for guest checkout", 400);
  }

  const cartItems = await CartItem.find(ownerFilter);
  if (cartItems.length === 0) throw new AppError("Cart is empty", 400);

  const orderItems = [];
  const lineItems = []; // Stripe line items

  for (const ci of cartItems) {
    if (ci.itemType === "product") {
      const product = await Product.findById(ci.itemId);
      if (!product || !product.active) throw new AppError(`Product no longer available`, 409);

      if (ci.variantId) {
        const variant = product.variants.id(ci.variantId);
        if (!variant || variant.stockQuantity < ci.quantity) {
          throw new AppError(`"${product.name}" is out of stock in that size`, 409);
        }
      } else if (product.stockQuantity != null && product.stockQuantity < ci.quantity) {
        throw new AppError(`"${product.name}" is out of stock`, 409);
      }

      orderItems.push({
        itemType: "product",
        itemId: product._id,
        variantId: ci.variantId,
        name: product.name,
        quantity: ci.quantity,
        unitPrice: product.price,
      });
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: ci.quantity,
      });
    } else {
      const ticketType = await TicketType.findById(ci.itemId);
      if (!ticketType) throw new AppError("Ticket type no longer available", 409);

      const activePhase = ticketType.getActivePhase();
      if (!activePhase) throw new AppError(`"${ticketType.name}" is sold out`, 409);

      const remaining = activePhase.quantityCap - activePhase.quantitySold;
      if (remaining < ci.quantity) {
        throw new AppError(
          `Only ${remaining} "${ticketType.name}" (${activePhase.label}) ticket(s) left`,
          409
        );
      }

      orderItems.push({
        itemType: "ticket",
        itemId: ticketType._id,
        name: ticketType.name,
        phaseLabel: activePhase.label,
        quantity: ci.quantity,
        unitPrice: activePhase.price,
      });
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `${ticketType.name} (${activePhase.label})` },
          unit_amount: Math.round(activePhase.price * 100),
        },
        quantity: ci.quantity,
      });
    }
  }

  const totalAmount = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const orderType = orderItems.every((i) => i.itemType === "ticket")
    ? "ticket"
    : orderItems.every((i) => i.itemType === "product")
    ? "product"
    : "mixed";

  // Pending order — auto-expires in 30 minutes via the TTL index on Order.expiresAt
  // if the customer never completes payment, releasing any implicit hold.
  const order = await Order.create({
    userId: req.user?._id,
    guestEmail: req.user ? undefined : guestEmail,
    items: orderItems,
    orderType,
    status: "pending",
    totalAmount,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    customer_email: req.user?.email || guestEmail,
    success_url: `${process.env.CLIENT_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
    metadata: { orderId: order._id.toString() },
  });

  order.stripeSessionId = session.id;
  await order.save();

  res.json({ checkoutUrl: session.url, orderId: order._id });
});

module.exports = { createCheckoutSession };
