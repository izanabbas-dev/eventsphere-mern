import ExhibitorApplication from "../models/ExhibitorApplication.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import { createNotification } from "../utils/notify.js";
import { emitBoothUpdated } from "../utils/socket.js";
import { freeExhibitorBooths, findOtherBooth } from "../utils/boothHelpers.js";

const notifyExhibitor = (exhibitorId, title, message) => {
  return createNotification({
    user: exhibitorId,
    title,
    message,
    type: "application",
    link: "/applications/my",
  });
};

// POST /api/expos/:expoId/applications
export const applyToExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo || expo.status !== "published") {
    return res.status(400).json({ success: false, message: "You can only apply to a published expo" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) {
    return res.status(400).json({ success: false, message: "Please create your exhibitor profile first" });
  }

  // Remove repeated ids, then make sure every booth belongs to this expo
  const preferredBooths = [...new Set((req.body.preferredBooths || []).map(String))];
  const boothCount = await Booth.countDocuments({ _id: { $in: preferredBooths }, expo: expo._id });
  if (boothCount !== preferredBooths.length) {
    return res.status(400).json({ success: false, message: "Preferred booths must belong to this expo" });
  }

  let application = await ExhibitorApplication.findOne({ expo: expo._id, exhibitor: req.user._id });

  if (application && application.status !== "withdrawn") {
    return res.status(400).json({ success: false, message: "You have already applied to this expo" });
  }

  // A withdrawn application is reused, because only one application per expo is allowed
  if (!application) {
    application = new ExhibitorApplication({ expo: expo._id, exhibitor: req.user._id });
  }

  application.profile = profile._id;
  application.message = req.body.message;
  application.preferredBooths = preferredBooths;
  application.status = "pending";
  application.adminNote = "";
  await application.save();

  res.status(201).json({ success: true, message: "Application submitted", application });
};

// GET /api/applications/my
export const getMyApplications = async (req, res) => {
  const applications = await ExhibitorApplication.find({ exhibitor: req.user._id })
    .sort({ createdAt: -1 })
    .populate("expo", "title startDate endDate location status")
    .populate("preferredBooths", "boothNumber hall")
    .populate("assignedBooth", "boothNumber hall position");

  res.status(200).json({ success: true, count: applications.length, applications });
};

// PATCH /api/applications/:id/withdraw
export const withdrawApplication = async (req, res) => {
  const application = await ExhibitorApplication.findById(req.params.id);

  if (!application || !application.exhibitor.equals(req.user._id)) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  if (application.status !== "pending") {
    return res.status(400).json({ success: false, message: "Only a pending application can be withdrawn" });
  }

  await freeExhibitorBooths(application.expo, application.exhibitor);

  application.status = "withdrawn";
  application.assignedBooth = null;
  await application.save();

  res.status(200).json({ success: true, message: "Application withdrawn", application });
};

// GET /api/expos/:expoId/applications?status=pending
export const getExpoApplications = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const filter = { expo: expo._id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await ExhibitorApplication.find(filter)
    .sort({ createdAt: 1 })
    .populate("exhibitor", "name email phone")
    .populate("profile", "companyName logo category website contact")
    .populate("preferredBooths", "boothNumber hall status")
    .populate("assignedBooth", "boothNumber hall");

  res.status(200).json({ success: true, count: applications.length, applications });
};

// GET /api/applications/:id
export const getApplication = async (req, res) => {
  const application = await ExhibitorApplication.findById(req.params.id)
    .populate("expo", "title startDate endDate location status")
    .populate("exhibitor", "name email phone")
    .populate("profile")
    .populate("preferredBooths", "boothNumber hall position size price status")
    .populate("assignedBooth", "boothNumber hall position size price status");

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  res.status(200).json({ success: true, application });
};

// PATCH /api/applications/:id/approve
// If boothId is sent, that booth is booked for the exhibitor
export const approveApplication = async (req, res) => {
  const application = await ExhibitorApplication.findById(req.params.id).populate("expo", "title");

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  if (application.status !== "pending") {
    return res.status(400).json({ success: false, message: "Only a pending application can be approved" });
  }

  if (req.body.boothId) {
    const booth = await Booth.findById(req.body.boothId);

    if (!booth || !booth.expo.equals(application.expo._id)) {
      return res.status(400).json({ success: false, message: "Booth not found in this expo" });
    }

    // Booth must be free, or already held (reserved or booked) by this same exhibitor
    const heldBySameExhibitor = booth.exhibitor && booth.exhibitor.equals(application.exhibitor);
    if (booth.status !== "available" && !heldBySameExhibitor) {
      return res.status(400).json({ success: false, message: "Booth is not available" });
    }

    const otherBooth = await findOtherBooth(booth.expo, application.exhibitor, booth._id);
    if (otherBooth) {
      return res.status(400).json({
        success: false,
        message: `This exhibitor already holds booth ${otherBooth.boothNumber} in this expo`,
      });
    }

    booth.exhibitor = application.exhibitor;
    booth.status = "booked";
    await booth.save();
    emitBoothUpdated(booth);

    application.assignedBooth = booth._id;
  }

  application.status = "approved";
  if (req.body.adminNote !== undefined) application.adminNote = req.body.adminNote;
  await application.save();

  await notifyExhibitor(
    application.exhibitor,
    "Application approved",
    `Your application for ${application.expo.title} has been approved.`
  );

  res.status(200).json({ success: true, message: "Application approved", application });
};

// PATCH /api/applications/:id/reject
export const rejectApplication = async (req, res) => {
  const application = await ExhibitorApplication.findById(req.params.id).populate("expo", "title");

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  if (application.status !== "pending") {
    return res.status(400).json({ success: false, message: "Only a pending application can be rejected" });
  }

  await freeExhibitorBooths(application.expo._id, application.exhibitor);

  application.status = "rejected";
  application.adminNote = req.body.adminNote;
  application.assignedBooth = null;
  await application.save();

  await notifyExhibitor(
    application.exhibitor,
    "Application rejected",
    `Your application for ${application.expo.title} was rejected. Note: ${application.adminNote}`
  );

  res.status(200).json({ success: true, message: "Application rejected", application });
};
