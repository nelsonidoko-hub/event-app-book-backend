const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { errorHandler } = require("./middleware/errorHandler");
const webhookRoutes = require("./routes/webhookRoutes");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const sponsorRoutes = require("./routes/sponsorRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// IMPORTANT: the Stripe webhook route needs the raw request body to verify
// the signature, so it's mounted BEFORE express.json() with its own
// express.raw() middleware. Every other route gets normal JSON parsing.
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/speakers", speakerRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

module.exports = app;
