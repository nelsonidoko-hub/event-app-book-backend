const stripe = require("../utils/stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");
const TicketType = require("../models/TicketType");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Event = require("../models/Event");
const { generateTicketToken, generateQRDataUrl } = require("../utils/qrcode");
const { sendOrderConfirmation, sendTicketEmail } = require("../utils/email");

// IMPORTANT: this route must receive the RAW request body (not JSON-parsed)
// for Stripe's signature verification to work — see server.js for the
// express.raw() middleware wired specifically to this route.
async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await handleCheckoutCompleted(session);
    } catch (err) {
      // Log and still 200 the webhook receipt only if it's a duplicate/no-op;
      // for real processing errors we 500 so Stripe retries the webhook.
      console.error("Error handling checkout.session.completed:", err);
      return res.status(500).send("Webhook handler failed");
    }
  }

  res.json({ received: true });
}

async function handleCheckoutCompleted(session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (!order) return;
  if (order.status === "paid") return; // idempotency guard — webhook can fire more than once

  order.status = "paid";
  order.stripePaymentIntentId = session.payment_intent;
  order.expiresAt = undefined; // cancel the pending-order TTL cleanup now that it's paid
  await order.save();

  const user = order.userId ? await User.findById(order.userId) : null;

  // Decrement stock / increment tickets sold, per line item
  for (const item of order.items) {
    if (item.itemType === "product") {
      if (item.variantId) {
        await Product.updateOne(
          { _id: item.itemId, "variants._id": item.variantId },
          { $inc: { "variants.$.stockQuantity": -item.quantity } }
        );
      } else {
        await Product.updateOne({ _id: item.itemId }, { $inc: { stockQuantity: -item.quantity } });
      }
    } else if (item.itemType === "ticket") {
      const ticketType = await TicketType.findById(item.itemId);
      if (!ticketType) continue;

      // Increment quantitySold on the matching phase (found by label)
      await TicketType.updateOne(
        { _id: item.itemId, "phases.label": item.phaseLabel },
        { $inc: { "phases.$.quantitySold": item.quantity } }
      );

      // Issue one Ticket document per unit purchased, each with its own QR code
      const event = await Event.findById(ticketType.eventId);
      for (let i = 0; i < item.quantity; i++) {
        const token = generateTicketToken();
        const ticket = await Ticket.create({
          orderId: order._id,
          orderItemId: item._id,
          ticketTypeId: ticketType._id,
          eventId: ticketType.eventId,
          attendeeName: user?.name || order.guestEmail,
          attendeeEmail: user?.email || order.guestEmail,
          qrCode: token,
        });

        const qrDataUrl = await generateQRDataUrl(token);
        await sendTicketEmail(ticket, qrDataUrl, event);
      }
    }
  }

  await sendOrderConfirmation(order, user);
}

module.exports = { stripeWebhook };
