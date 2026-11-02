// Wrap async route handlers so thrown errors reach the error handler
// instead of crashing the process or hanging the request.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Custom error class for expected/handled failures (e.g. "out of stock"),
// so the handler below can send the right status code.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Must be registered last, after all routes.
function errorHandler(err, _req, res, _next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = { asyncHandler, AppError, errorHandler };
