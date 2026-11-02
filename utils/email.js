const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html, attachments }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    attachments,
  });
}

async function sendOrderConfirmation(order, user) {
  await sendEmail({
    to: user?.email || order.guestEmail,
    subject: `Order Confirmation — #${order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Order total: $${order.totalAmount.toFixed(2)}</p>
      <ul>
        ${order.items
          .map((i) => `<li>${i.name} x${i.quantity} — $${i.unitPrice.toFixed(2)}</li>`)
          .join("")}
      </ul>
      <p>You'll receive your ticket(s) as a separate email with your QR code(s).</p>
    `,
  });
}

async function sendTicketEmail(ticket, qrDataUrl, event) {
  await sendEmail({
    to: ticket.attendeeEmail,
    subject: `Your Ticket — ${event.title}`,
    html: `
      <h2>Your ticket is ready, ${ticket.attendeeName}!</h2>
      <p>Event: ${event.title}</p>
      <p>Present the QR code below at check-in.</p>
      <img src="${qrDataUrl}" alt="Ticket QR Code" width="200" height="200" />
    `,
  });
}

async function sendApplicationStatusEmail(user, type, status) {
  await sendEmail({
    to: user.email,
    subject: `Your ${type} application has been ${status}`,
    html: `<p>Hi ${user.name}, your ${type} application has been <strong>${status}</strong>. ${
      status === "approved"
        ? "We'll follow up shortly with next steps."
        : "Feel free to reach out with any questions."
    }</p>`,
  });
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendTicketEmail,
  sendApplicationStatusEmail,
};
