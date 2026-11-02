const mongoose = require("mongoose");

const speakerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    bio: { type: String },
    photoUrl: { type: String },
    topic: { type: String },
    pastSpeakingExperience: { type: String },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Speaker", speakerSchema);
