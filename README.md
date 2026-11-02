# Summit Backend API

Node/Express + MongoDB backend for the International Women's Church Summit site — tickets (3-phase pricing), store (books/apparel), cart, Stripe checkout, vendor/sponsor/speaker applications, and an admin API.

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY, etc.
npm run seed            # optional: creates a sample event, tickets, products, admin user
npm run dev              # starts on http://localhost:5000 with nodemon
```

Seeded admin login (if you ran `npm run seed`): `admin@example.com` / `ChangeMe123!` — change this immediately in any real deployment.

## Stripe webhook (local testing)

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```
Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `.env`.

## Folder structure

```
config/       MongoDB connection
models/       Mongoose schemas
controllers/  Business logic per resource
routes/       Express routers, wired to controllers + middleware
middleware/   auth (JWT), error handling
utils/        stripe client, email sending, QR generation, seed script
app.js        Express app + middleware wiring
server.js     Entry point — connects DB, starts the server
```

## Auth

- `POST /api/auth/register` — `{ name, email, password, phone? }` → `{ user, token }`
- `POST /api/auth/login` — `{ email, password }` → `{ user, token }`
- `GET  /api/auth/me` — requires `Authorization: Bearer <token>`

Guest cart/checkout works without a token — send an `x-session-id` header (any client-generated UUID, e.g. from `crypto.randomUUID()` stored in localStorage) instead. Call `POST /api/cart/merge` right after login to fold a guest cart into the new account.

## Events & Tickets

- `GET /api/events` — list all events
- `GET /api/events/:slug` — event details
- `GET /api/events/:slug/ticket-types` — ticket types with the **currently active pricing phase** already resolved (Early Bird / Regular / Door) — the frontend doesn't need to replicate the date logic
- `POST /api/events` / `PATCH /api/events/:id` — admin only

## Store

- `GET /api/products` — list active products (`?category=book|apparel|merch`)
- `GET /api/products/:id`
- `POST /api/products` / `PATCH /api/products/:id` — admin only

## Cart

All routes accept either a logged-in `Authorization` header or a guest `x-session-id` header.

- `GET /api/cart` — live-priced cart with a computed total
- `POST /api/cart/add` — `{ itemType: "product"|"ticket", itemId, variantId?, quantity }`
- `PATCH /api/cart/:id` — `{ quantity }`
- `DELETE /api/cart/:id`

## Checkout

- `POST /api/checkout/create-session` — validates stock/ticket availability, creates a pending `Order`, returns a Stripe-hosted `checkoutUrl` to redirect the browser to.
- `POST /api/webhooks/stripe` — Stripe calls this, not the frontend. On `checkout.session.completed` it marks the order paid, decrements stock/ticket phase counts, issues `Ticket` documents with QR codes, and emails the confirmation + tickets. **This webhook is the only thing that ever marks an order paid** — never trust the success redirect alone.

## Applications

- `POST /api/vendors/apply`, `POST /api/sponsors/apply`, `POST /api/speakers/apply` — require login
- `GET /api/vendors/mine`, `/api/sponsors/mine`, `/api/speakers/mine` — the logged-in user's own applications

## Admin (all require an admin-role JWT)

- `GET /api/admin/orders?orderType=&status=`
- `GET /api/admin/applications?type=vendor|sponsor|speaker&status=`
- `PATCH /api/admin/applications/:type/:id` — `{ status: "approved"|"rejected" }` — emails the applicant automatically
- `GET /api/admin/analytics` — ticket revenue, product revenue, tickets sold, pending application counts
- `POST /api/admin/checkin` — `{ qrCode }` — scans a ticket at the door, rejects already-used ones

## Known simplifications (call these out to the client if scope grows)

- Stock/ticket-availability checks use `findOneAndUpdate`-style atomic updates rather than full MongoDB multi-document transactions. Fine at moderate traffic; if you expect a flash-sale-style rush at ticket launch, wrap the checkout validation in a real Mongo session transaction (requires a replica set, which MongoDB Atlas gives you by default).
- No image upload endpoint yet — `imageUrl`/`logoUrl`/`photoUrl` fields expect a URL (e.g. from a separate Cloudinary upload widget on the frontend). Add a `multer` + Cloudinary upload route if you want the backend to handle uploads directly.
- No rate limiting yet — add `express-rate-limit` on `/api/auth` and the `/apply` routes before going to production.
