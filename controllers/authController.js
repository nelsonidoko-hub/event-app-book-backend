const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError("An account with this email already exists", 409);

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, phone });

  const token = signToken(user);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required", 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError("Invalid credentials", 401);

  const valid = await user.comparePassword(password);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const token = signToken(user);
  res.json({ user, token });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, me };
