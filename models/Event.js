const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String },
    location: { type: String },
    bannerImageUrl: { type: String },
    schedule: [
      {
        day: String, // e.g. "Day 1"
        date: Date,
        location: String,
        startTime: String,
        endTime: String,
        details: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
