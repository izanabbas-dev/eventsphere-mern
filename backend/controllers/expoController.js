import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import Session from "../models/Session.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import { emitToExpo } from "../utils/socket.js";
import { getFileUrl, deleteFile } from "../middleware/upload.js";

const expoFields = ["title", "description", "theme", "startDate", "endDate", "location"];

const isAdmin = (req) => req.user && req.user.role === "admin";

// POST /api/expos
export const createExpo = async (req, res) => {
  const { title, description, theme, startDate, endDate, location, floorPlan } = req.body;

  const expo = await Expo.create({
    title,
    description,
    theme,
    startDate,
    endDate,
    location,
    floorPlan,
    organizer: req.user._id,
  });

  res.status(201).json({ success: true, message: "Expo created", expo });
};

// GET /api/expos?status=published&search=tech
// Guests and non-admins never see draft expos
export const getExpos = async (req, res) => {
  const { status, search } = req.query;

  if (!isAdmin(req) && status === "draft") {
    return res.status(200).json({ success: true, count: 0, expos: [] });
  }

  const filter = {};

  if (status) {
    filter.status = status;
  } else if (!isAdmin(req)) {
    filter.status = { $ne: "draft" };
  }

  if (search) {
    // Escape special characters so the search text is matched as plain text
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: safeSearch, $options: "i" };
  }

  const expos = await Expo.find(filter).sort({ startDate: 1 }).populate("organizer", "name");

  res.status(200).json({ success: true, count: expos.length, expos });
};

// GET /api/expos/:id
export const getExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.id).populate("organizer", "name");

  if (!expo || (expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  res.status(200).json({ success: true, expo });
};

// PUT /api/expos/:id
// Status is changed with PATCH /:id/status, not here
export const updateExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  expoFields.forEach((field) => {
    if (req.body[field] !== undefined) expo[field] = req.body[field];
  });

  if (req.body.floorPlan) {
    if (req.body.floorPlan.rows !== undefined) expo.floorPlan.rows = req.body.floorPlan.rows;
    if (req.body.floorPlan.cols !== undefined) expo.floorPlan.cols = req.body.floorPlan.cols;
  }

  // save() runs the model checks, e.g. end date after start date
  await expo.save();

  emitToExpo(expo._id, "expo_updated", { expo });

  res.status(200).json({ success: true, message: "Expo updated", expo });
};

// DELETE /api/expos/:id
export const deleteExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  await Booth.deleteMany({ expo: expo._id });
  await Session.deleteMany({ expo: expo._id });
  await ExhibitorApplication.deleteMany({ expo: expo._id });
  await expo.deleteOne();

  res.status(200).json({ success: true, message: "Expo and its booths, sessions and applications deleted" });
};

// PATCH /api/expos/:id/status
export const updateExpoStatus = async (req, res) => {
  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  expo.status = req.body.status;
  await expo.save();

  emitToExpo(expo._id, "expo_updated", { expo });

  res.status(200).json({ success: true, message: `Expo status changed to ${expo.status}`, expo });
};

// POST /api/expos/:id/banner  (form-data field: banner)
export const uploadExpoBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please choose an image to upload" });
  }

  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    await deleteFile(getFileUrl(req.file));
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const oldBanner = expo.banner;
  expo.banner = getFileUrl(req.file);
  await expo.save();
  await deleteFile(oldBanner);

  emitToExpo(expo._id, "expo_updated", { expo });

  res.status(200).json({ success: true, message: "Banner uploaded", banner: expo.banner });
};
