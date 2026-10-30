import mongoose from "mongoose";
import Expo from "../models/Expo.js";
import User from "../models/User.js";
import Booth from "../models/Booth.js";
import BoothVisit from "../models/BoothVisit.js";
import Registration from "../models/Registration.js";
import Bookmark from "../models/Bookmark.js";
import Session from "../models/Session.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Feedback from "../models/Feedback.js";

// Turns [{ _id: "booked", count: 3 }] into { available: 0, reserved: 0, booked: 3 }
const toCountObject = (groups, keys) => {
  const result = {};
  keys.forEach((key) => (result[key] = 0));
  groups.forEach((group) => (result[group._id] = group.count));
  return result;
};

const countBy = (Model, match, field) => {
  return Model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
};

// GET /api/analytics/expos/:expoId
export const getExpoReport = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  // Aggregation does not convert string ids, so use an ObjectId
  const expoId = new mongoose.Types.ObjectId(req.params.expoId);

  // Expo registrations only (session = null), cancelled ones are not counted
  const attendeeMatch = { expo: expoId, session: null, status: { $ne: "cancelled" } };

  const totalAttendees = await Registration.countDocuments(attendeeMatch);

  const attendeesPerDay = await Registration.aggregate([
    { $match: attendeeMatch },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);

  const boothGroups = await countBy(Booth, { expo: expoId }, "status");
  const applicationGroups = await countBy(ExhibitorApplication, { expo: expoId }, "status");

  const topBooths = await BoothVisit.aggregate([
    { $match: { expo: expoId } },
    { $group: { _id: "$booth", visits: { $sum: 1 } } },
    { $sort: { visits: -1 } },
    { $limit: 5 },
    { $lookup: { from: "booths", localField: "_id", foreignField: "_id", as: "booth" } },
    { $unwind: "$booth" },
    { $project: { _id: 0, boothId: "$_id", boothNumber: "$booth.boothNumber", hall: "$booth.hall", visits: 1 } },
  ]);

  // Session popularity = registrations + bookmarks
  const sessionRegistrations = await countBy(
    Registration,
    { expo: expoId, session: { $ne: null }, status: { $ne: "cancelled" } },
    "session"
  );
  const sessionBookmarks = await countBy(Bookmark, { expo: expoId }, "session");
  const sessions = await Session.find({ expo: expoId }).select("title startTime");

  const getCount = (groups, sessionId) => {
    const group = groups.find((g) => g._id.equals(sessionId));
    return group ? group.count : 0;
  };

  const topSessions = sessions
    .map((session) => {
      const registrations = getCount(sessionRegistrations, session._id);
      const bookmarks = getCount(sessionBookmarks, session._id);
      return {
        sessionId: session._id,
        title: session.title,
        startTime: session.startTime,
        registrations,
        bookmarks,
        total: registrations + bookmarks,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // $avg skips feedback without a rating
  const feedbackStats = await Feedback.aggregate([
    { $match: { expo: expoId } },
    { $group: { _id: null, count: { $sum: 1 }, averageRating: { $avg: "$rating" } } },
  ]);

  const feedback = {
    count: feedbackStats.length ? feedbackStats[0].count : 0,
    averageRating:
      feedbackStats.length && feedbackStats[0].averageRating
        ? Math.round(feedbackStats[0].averageRating * 10) / 10
        : null,
  };

  res.status(200).json({
    success: true,
    report: {
      expo: { _id: expo._id, title: expo.title, status: expo.status },
      totalAttendees,
      attendeesPerDay,
      boothsByStatus: toCountObject(boothGroups, ["available", "reserved", "booked"]),
      applicationsByStatus: toCountObject(applicationGroups, ["pending", "approved", "rejected", "withdrawn"]),
      topBooths,
      topSessions,
      feedback,
    },
  });
};

// GET /api/analytics/overview
export const getOverview = async (req, res) => {
  const userGroups = await countBy(User, {}, "role");
  const expoGroups = await countBy(Expo, {}, "status");
  const totalRegistrations = await Registration.countDocuments({ session: null, status: { $ne: "cancelled" } });
  const totalFeedback = await Feedback.countDocuments();

  res.status(200).json({
    success: true,
    overview: {
      usersByRole: toCountObject(userGroups, ["admin", "exhibitor", "attendee"]),
      exposByStatus: toCountObject(expoGroups, ["draft", "published", "ongoing", "completed", "cancelled"]),
      totalRegistrations,
      totalFeedback,
    },
  });
};
