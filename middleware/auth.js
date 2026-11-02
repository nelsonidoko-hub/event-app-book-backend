const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and attaches req.user. Rejects if missing/invalid.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Like requireAuth, but doesn't fail if no token is present — used for
// endpoints that behave differently for guests vs logged-in users (e.g. cart).
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
    next();
  } catch {
    next(); // treat as guest on bad token rather than blocking
  }
}

// Restrict a route to specific roles, e.g. requireRole("admin")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden — insufficient permissions" });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
