const Sponsor = require("../models/Sponsor");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

const applyAsSponsor = asyncHandler(async (req, res) => {
  const { eventId, companyName, website, sponsorshipTier, amount, logoUrl } = req.body;
  if (!eventId || !companyName) throw new AppError("eventId and companyName are required", 400);

  const sponsor = await Sponsor.create({
    userId: req.user._id,
    eventId,
    companyName,
    website,
    sponsorshipTier,
    amount,
    logoUrl,
  });

  res.status(201).json({ sponsor });
});

const getMySponsorApplications = asyncHandler(async (req, res) => {
  const sponsors = await Sponsor.find({ userId: req.user._id });
  res.json({ sponsors });
});

module.exports = { applyAsSponsor, getMySponsorApplications };
