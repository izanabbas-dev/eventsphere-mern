import Session from "../models/Session.js";
import Expo from "../models/Expo.js";
import Registration from "../models/Registration.js";
import Bookmark from "../models/Bookmark.js";
import { createNotifications } from "../utils/notify.js";
import { emitToExpo } from "../utils/socket.js";

const isAdmin = (req) => req.user && req.user.role === "admin";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatTime = (date) => date.toLocaleString("en-GB", { timeZone: "Asia/Karachi" });

// Session times must be inside the expo days (from the start of the first day to the end of the last day)
const getTimeError = (expo, startTime, endTime) => {
  if (endTime <= startTime) {
    return "End time must be after the start time";
  }

  const expoStart = new Date(expo.startDate);
  expoStart.setUTCHours(0, 0, 0, 0);
  const expoEnd = new Date(expo.endDate);
  expoEnd.setUTCHours(23, 59, 59, 999);

  if (startTime < expoStart || endTime > expoEnd) {
    return "Session time must be inside the expo dates";
  }

  return null;
};

// Two sessions overlap when one starts before the other ends
const getOverlapError = async (expoId, location, startTime, endTime, sessionId) => {
  const filter = {
    expo: expoId,
    location,
    status: { $ne: "cancelled" },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (sessionId) filter._id = { $ne: sessionId };

  const clash = await Session.findOne(filter);
  if (clash) {
    return `${location} is already booked for "${clash.title}" at that time`;
  }

  return null;
};

const cleanSpeakers = (speakers) =>
  speakers.map((speaker) => ({ name: speaker.name, designation: speaker.designation, bio: speaker.bio }));

// Sends one notification to every user who registered for or bookmarked the session
const notifySessionUsers = async (session, title, message) => {
  const registrations = await Registration.find({ session: session._id, status: "registered" }).select("attendee");
  const bookmarks = await Bookmark.find({ session: session._id }).select("user");

  const userIds = new Set([
    ...registrations.map((registration) => registration.attendee.toString()),
    ...bookmarks.map((bookmark) => bookmark.user.toString()),
  ]);

  const notifications = [...userIds].map((userId) => ({
    user: userId,
    title,
    message,
    type: "session",
    link: `/sessions/${session._id}`,
  }));

  if (notifications.length > 0) {
    await createNotifications(notifications);
  }
};

// POST /api/expos/:expoId/sessions
export const createSession = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const { title, description, topic, type, speakers, location, capacity } = req.body;
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);

  const timeError = getTimeError(expo, startTime, endTime);
  if (timeError) {
    return res.status(400).json({ success: false, message: timeError });
  }

  const overlapError = await getOverlapError(expo._id, location, startTime, endTime);
  if (overlapError) {
    return res.status(400).json({ success: false, message: overlapError });
  }

  const session = await Session.create({
    expo: expo._id,
    title,
    description,
    topic,
    type,
    speakers: speakers ? cleanSpeakers(speakers) : [],
    location,
    startTime,
    endTime,
    capacity,
  });

  emitToExpo(expo._id, "schedule_updated", { action: "created", session });

  res.status(201).json({ success: true, message: "Session created", session });
};

// GET /api/expos/:expoId/sessions?date=2026-12-10&type=workshop&topic=AI&search=ali
export const getSessions = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo || (expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const { date, type, topic, search } = req.query;
  const filter = { expo: expo._id };

  if (!isAdmin(req)) filter.status = { $ne: "cancelled" };
  if (type) filter.type = type;
  if (topic) filter.topic = { $regex: `^${escapeRegex(topic)}$`, $options: "i" };

  // All sessions that start on this day
  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    filter.startTime = { $gte: dayStart, $lte: dayEnd };
  }

  if (search) {
    const searchRegex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ title: searchRegex }, { "speakers.name": searchRegex }];
  }

  const sessions = await Session.find(filter).sort({ startTime: 1 });

  res.status(200).json({ success: true, count: sessions.length, sessions });
};

// GET /api/sessions/:id
export const getSession = async (req, res) => {
  const session = await Session.findById(req.params.id).populate("expo", "title location startDate endDate status");

  if (!session || !session.expo || (session.expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  res.status(200).json({ success: true, session });
};

// PUT /api/sessions/:id
export const updateSession = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (session.status === "cancelled") {
    return res.status(400).json({ success: false, message: "A cancelled session cannot be updated" });
  }

  const oldStart = session.startTime.getTime();
  const oldEnd = session.endTime.getTime();
  const oldLocation = session.location;

  ["title", "description", "topic", "type", "location", "capacity"].forEach((field) => {
    if (req.body[field] !== undefined) session[field] = req.body[field];
  });

  if (req.body.speakers !== undefined) session.speakers = cleanSpeakers(req.body.speakers);
  if (req.body.startTime !== undefined) session.startTime = new Date(req.body.startTime);
  if (req.body.endTime !== undefined) session.endTime = new Date(req.body.endTime);

  const timeChanged = session.startTime.getTime() !== oldStart || session.endTime.getTime() !== oldEnd;
  const locationChanged = session.location !== oldLocation;

  if (timeChanged || locationChanged) {
    const expo = await Expo.findById(session.expo);

    const timeError = getTimeError(expo, session.startTime, session.endTime);
    if (timeError) {
      return res.status(400).json({ success: false, message: timeError });
    }

    const overlapError = await getOverlapError(
      session.expo,
      session.location,
      session.startTime,
      session.endTime,
      session._id
    );
    if (overlapError) {
      return res.status(400).json({ success: false, message: overlapError });
    }
  }

  await session.save();

  // New time means the bookmark reminders must be sent again
  if (timeChanged) {
    await Bookmark.updateMany({ session: session._id }, { reminderSent: false });
  }

  if (timeChanged || locationChanged) {
    await notifySessionUsers(
      session,
      "Session updated",
      `"${session.title}" is now at ${session.location}, ${formatTime(session.startTime)} to ${formatTime(session.endTime)}.`
    );
  }

  emitToExpo(session.expo, "schedule_updated", { action: "updated", session });

  res.status(200).json({ success: true, message: "Session updated", session });
};

// PATCH /api/sessions/:id/cancel
export const cancelSession = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (session.status === "cancelled") {
    return res.status(400).json({ success: false, message: "Session is already cancelled" });
  }

  session.status = "cancelled";
  await session.save();

  await notifySessionUsers(session, "Session cancelled", `"${session.title}" has been cancelled.`);

  emitToExpo(session.expo, "schedule_updated", { action: "cancelled", session });

  res.status(200).json({ success: true, message: "Session cancelled", session });
};

// DELETE /api/sessions/:id
export const deleteSession = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  await Registration.deleteMany({ session: session._id });
  await Bookmark.deleteMany({ session: session._id });
  await session.deleteOne();

  emitToExpo(session.expo, "schedule_updated", { action: "deleted", sessionId: session._id });

  res.status(200).json({ success: true, message: "Session and its registrations and bookmarks deleted" });
};
