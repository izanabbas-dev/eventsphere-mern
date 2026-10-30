import Feedback from "../models/Feedback.js";
import Expo from "../models/Expo.js";
import { createNotification } from "../utils/notify.js";

// POST /api/feedback
export const createFeedback = async (req, res) => {
  const { type, subject, message, rating, expoId } = req.body;

  if (expoId) {
    const expo = await Expo.findById(expoId);
    if (!expo || expo.status === "draft") {
      return res.status(404).json({ success: false, message: "Expo not found" });
    }
  }

  const feedback = await Feedback.create({
    user: req.user._id,
    expo: expoId || null,
    type,
    subject,
    message,
    rating: rating || null,
  });

  res.status(201).json({ success: true, message: "Feedback submitted", feedback });
};

// GET /api/feedback/my
export const getMyFeedback = async (req, res) => {
  const feedback = await Feedback.find({ user: req.user._id }).populate("expo", "title").sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: feedback.length, feedback });
};

// GET /api/feedback?status=open&type=issue
export const getAllFeedback = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const feedback = await Feedback.find(filter)
    .populate("user", "name email role")
    .populate("expo", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: feedback.length, feedback });
};

// PATCH /api/feedback/:id
export const updateFeedback = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return res.status(404).json({ success: false, message: "Feedback not found" });
  }

  if (req.body.status !== undefined) feedback.status = req.body.status;
  if (req.body.adminResponse !== undefined) feedback.adminResponse = req.body.adminResponse;
  await feedback.save();

  await createNotification({
    user: feedback.user,
    title: "Feedback updated",
    message: `Your feedback "${feedback.subject}" is now ${feedback.status.replace("_", " ")}.`,
    type: "system",
    link: "/feedback/my",
  });

  res.status(200).json({ success: true, message: "Feedback updated", feedback });
};
