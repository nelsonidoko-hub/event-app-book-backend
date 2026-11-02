const Vendor = require("../models/Vendor");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

const applyAsVendor = asyncHandler(async (req, res) => {
  const { eventId, businessName, description, website, boothTier, boothPrice } = req.body;
  if (!eventId || !businessName) throw new AppError("eventId and businessName are required", 400);

  const vendor = await Vendor.create({
    userId: req.user._id,
    eventId,
    businessName,
    description,
    website,
    boothTier,
    boothPrice,
  });

  res.status(201).json({ vendor });
});

const getMyVendorApplications = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ userId: req.user._id });
  res.json({ vendors });
});

module.exports = { applyAsVendor, getMyVendorApplications };
