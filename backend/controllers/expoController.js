import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import Session from "../models/Session.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Registration from "../models/Registration.js";
import Bookmark from "../models/Bookmark.js";
import BoothVisit from "../models/BoothVisit.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { emitToExpo } from "../utils/socket.js";
import { createNotifications } from "../utils/notify.js";
import { saveImage, deleteFile, discardFiles } from "../middleware/upload.js";
import { isAdmin, escapeRegex } from "../utils/helpers.js";

const expoFields = ["title", "description", "theme", "startDate", "endDate", "location"];

const nextStatuses = {
  draft: ["published", "cancelled"],
  published: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

const notifyExpoRemoved = async (expo) => {
  const registrations = await Registration.find({ expo: expo._id, session: null, status: "registered" }).select("attendee");
  const applications = await ExhibitorApplication.find({
    expo: expo._id,
    status: { $in: ["pending", "approved"] },
  }).select("exhibitor");
  const booths = await Booth.find({ expo: expo._id, exhibitor: { $ne: null } }).select("exhibitor");

  const userIds = new Set([
    ...registrations.map((registration) => registration.attendee.toString()),
    ...applications.map((application) => application.exhibitor.toString()),
    ...booths.map((booth) => booth.exhibitor.toString()),
  ]);

  if (userIds.size === 0) return;

  await createNotifications(
    [...userIds].map((userId) => ({
      user: userId,
      title: "Expo removed",
      message: `"${expo.title}" has been removed by the organizer.`,
      type: "system",
    }))
  );
};

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

  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  const expos = await Expo.find(filter).sort({ startDate: 1 }).populate("organizer", "name");

  res.status(200).json({ success: true, count: expos.length, expos });
};

export const getExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.id).populate("organizer", "name");

  if (!expo || (expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  res.status(200).json({ success: true, expo });
};

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

  await expo.save();

  emitToExpo(expo._id, "expo_updated", { expo });

  res.status(200).json({ success: true, message: "Expo updated", expo });
};

export const deleteExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  await notifyExpoRemoved(expo);

  const conversations = await Conversation.find({ expo: expo._id }).select("_id");
  await Message.deleteMany({ conversation: { $in: conversations.map((c) => c._id) } });
  await Conversation.deleteMany({ expo: expo._id });

  await Registration.deleteMany({ expo: expo._id });
  await Bookmark.deleteMany({ expo: expo._id });
  await BoothVisit.deleteMany({ expo: expo._id });
  await ExhibitorApplication.deleteMany({ expo: expo._id });
  await Booth.deleteMany({ expo: expo._id });
  await Session.deleteMany({ expo: expo._id });
  await expo.deleteOne();
  await deleteFile(expo.banner);

  emitToExpo(expo._id, "expo_updated", { action: "deleted", expoId: expo._id });

  res.status(200).json({ success: true, message: "Expo deleted" });
};

export const updateExpoStatus = async (req, res) => {
  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const newStatus = req.body.status;

  if (!nextStatuses[expo.status].includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: `Status cannot change from ${expo.status} to ${newStatus}`,
    });
  }

  expo.status = newStatus;
  await expo.save();

  emitToExpo(expo._id, "expo_updated", { expo });

  res.status(200).json({ success: true, message: `Expo status changed to ${expo.status}`, expo });
};

export const uploadExpoBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please choose an image to upload" });
  }

  const expo = await Expo.findById(req.params.id);

  if (!expo) {
    await discardFiles([req.file]);
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const oldBanner = expo.banner;
  expo.banner = await saveImage(req.file, "banners");
  await expo.save();
  await deleteFile(oldBanner);

  emitToExpo(expo._id, "expo_updated", { expo });

  res.status(200).json({ success: true, message: "Banner uploaded", banner: expo.banner });
};
