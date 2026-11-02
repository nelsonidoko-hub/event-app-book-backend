const QRCode = require("qrcode");
const crypto = require("crypto");

// Generates a unique, hard-to-guess token to embed in the QR code.
// This token (not the ticket's Mongo _id) is what gets scanned at check-in,
// so a leaked ticket ID alone can't be used to forge entry.
function generateTicketToken() {
  return crypto.randomBytes(16).toString("hex");
}

// Returns a base64 data URL of the QR image — easy to embed directly in an email.
async function generateQRDataUrl(token) {
  return QRCode.toDataURL(token, { width: 300, margin: 2 });
}

module.exports = { generateTicketToken, generateQRDataUrl };
