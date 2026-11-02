// Populates the database with a sample event, ticket phases, and products
// so you can hit the API and see real data without using the admin routes first.
// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Event = require("../models/Event");
const TicketType = require("../models/TicketType");
const Product = require("../models/Product");
const User = require("../models/User");

async function seed() {
  await connectDB();

  await Promise.all([
    Event.deleteMany({}),
    TicketType.deleteMany({}),
    Product.deleteMany({}),
  ]);

  const event = await Event.create({
    title: "International Women's Church Summit 2027",
    slug: "iwcs-2027",
    description: "A gathering of faith, fellowship, and empowerment.",
    startDate: new Date("2027-03-12"),
    endDate: new Date("2027-03-13"),
    venue: "Grace Convention Center",
    location: "Dallas, TX",
    schedule: [
      { day: "Day 1", date: new Date("2027-03-12"), location: "Main Hall", startTime: "9:00 AM", endTime: "5:00 PM", details: "Worship & keynote sessions" },
      { day: "Day 2", date: new Date("2027-03-13"), location: "Main Hall", startTime: "9:00 AM", endTime: "4:00 PM", details: "Workshops & closing ceremony" },
    ],
  });

  await TicketType.create({
    eventId: event._id,
    name: "General Admission",
    description: "Full access to both days",
    phases: [
      { label: "Early Bird", price: 45, startDate: new Date("2026-08-01"), endDate: new Date("2026-11-01"), quantityCap: 150 },
      { label: "Regular", price: 65, startDate: new Date("2026-11-02"), endDate: new Date("2027-02-15"), quantityCap: 250 },
      { label: "Door", price: 85, startDate: new Date("2027-02-16"), endDate: new Date("2027-03-13"), quantityCap: 100 },
    ],
  });

  await TicketType.create({
    eventId: event._id,
    name: "VIP",
    description: "Front-row seating, VIP lounge access, and a gift bag",
    phases: [
      { label: "Early Bird", price: 120, startDate: new Date("2026-08-01"), endDate: new Date("2026-11-01"), quantityCap: 30 },
      { label: "Regular", price: 150, startDate: new Date("2026-11-02"), endDate: new Date("2027-02-15"), quantityCap: 40 },
      { label: "Door", price: 180, startDate: new Date("2027-02-16"), endDate: new Date("2027-03-13"), quantityCap: 20 },
    ],
  });

  await Product.create([
    {
      name: "Faith & Ownership Devotional",
      description: "30-day devotional for women stepping into purpose.",
      price: 18,
      category: "book",
      stockQuantity: 200,
    },
    {
      name: "Summit T-Shirt",
      description: "Official summit tee.",
      price: 25,
      category: "apparel",
      variants: [
        { size: "S", stockQuantity: 30 },
        { size: "M", stockQuantity: 40 },
        { size: "L", stockQuantity: 40 },
        { size: "XL", stockQuantity: 20 },
      ],
    },
  ]);

  const adminExists = await User.findOne({ email: "admin@example.com" });
  if (!adminExists) {
    await User.create({
      name: "Summit Admin",
      email: "admin@example.com",
      passwordHash: await User.hashPassword("ChangeMe123!"),
      role: "admin",
    });
    console.log("Seeded admin login: admin@example.com / ChangeMe123!");
  }

  console.log(`Seeded event: ${event.title} (${event.slug})`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
