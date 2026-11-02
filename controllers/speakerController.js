const Speaker = require("../models/Speaker");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

const applyAsSpeaker = asyncHandler(async (req, res) => {
  const { eventId, bio, photoUrl, topic, pastSpeakingExperience } = req.body;
  if (!eventId || !bio || !topic) throw new AppError("eventId, bio, and topic are required", 400);

  const speaker = await Speaker.create({
    userId: req.user._id,
    eventId,
    bio,
    photoUrl,
    topic,
    pastSpeakingExperience,
  });

  res.status(201).json({ speaker });
});

const getMySpeakerApplications = asyncHandler(async (req, res) => {
  const speakers = await Speaker.find({ userId: req.user._id });
  res.json({ speakers });
});

module.exports = { applyAsSpeaker, getMySpeakerApplications };
