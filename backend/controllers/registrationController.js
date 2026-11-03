import crypto from "crypto";
import Registration from "../models/Registration.js";
import Expo from "../models/Expo.js";
import Session from "../models/Session.js";
import { emitToExpo } from "../utils/socket.js";

// Live update for analytics and "seats left". No personal data is sent.
const emitRegistrationsUpdated = (expoId) => emitToExpo(expoId, "registrations_updated", { expoId });

// e.g. ES-4F9A1C2B
const makeTicketCode = () => `ES-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const decreaseSessionCount = (sessionId) => {
  return Session.updateOne({ _id: sessionId, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
};

// POST /api/expos/:expoId/register
export const registerForExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo || expo.status !== "published") {
    return res.status(400).json({ success: false, message: "You can only register for a published expo" });
  }

  let registration = await Registration.findOne({ attendee: req.user._id, expo: expo._id, session: null });

  if (registration && registration.status !== "cancelled") {
    return res.status(400).json({ success: false, message: "You are already registered for this expo" });
  }

  // A cancelled registration is reused and keeps its old ticket code
  if (!registration) {
    registration = new Registration({
      attendee: req.user._id,
      expo: expo._id,
      session: null,
      ticketCode: makeTicketCode(),
    });
  }

  registration.status = "registered";
  await registration.save();

  emitRegistrationsUpdated(expo._id);

  res.status(201).json({ success: true, message: "Registered for the expo", registration });
};

// POST /api/sessions/:id/register
export const registerForSession = async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (session.status === "cancelled") {
    return res.status(400).json({ success: false, message: "This session has been cancelled" });
  }

  if (session.endTime < new Date()) {
    return res.status(400).json({ success: false, message: "This session has already ended" });
  }

  const expoRegistration = await Registration.findOne({
    attendee: req.user._id,
    expo: session.expo,
    session: null,
    status: { $in: ["registered", "attended"] },
  });

  if (!expoRegistration) {
    return res.status(400).json({ success: false, message: "Please register for the expo first" });
  }

  let registration = await Registration.findOne({ attendee: req.user._id, expo: session.expo, session: session._id });

  if (registration && registration.status !== "cancelled") {
    return res.status(400).json({ success: false, message: "You are already registered for this session" });
  }

  if (session.registeredCount >= session.capacity) {
    return res.status(400).json({ success: false, message: "This session is full" });
  }

  // Save the registration first, then take a seat
  const isNewRegistration = !registration;
  if (isNewRegistration) {
    registration = new Registration({ attendee: req.user._id, expo: session.expo, session: session._id });
  }

  registration.status = "registered";
  await registration.save();

  // Take a seat only if there is still space, in one step so two people cannot take the last seat
  const updatedSession = await Session.findOneAndUpdate(
    { _id: session._id, status: "scheduled", $expr: { $lt: ["$registeredCount", "$capacity"] } },
    { $inc: { registeredCount: 1 } },
    { returnDocument: "after" }
  );

  // Someone took the last seat at the same time, so undo the registration
  if (!updatedSession) {
    if (isNewRegistration) {
      await registration.deleteOne();
    } else {
      registration.status = "cancelled";
      await registration.save();
    }
    return res.status(400).json({ success: false, message: "This session is full" });
  }

  emitRegistrationsUpdated(session.expo);

  res.status(201).json({
    success: true,
    message: "Registered for the session",
    seatsLeft: updatedSession.capacity - updatedSession.registeredCount,
    registration,
  });
};

// DELETE /api/registrations/:id
export const cancelRegistration = async (req, res) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration || !registration.attendee.equals(req.user._id)) {
    return res.status(404).json({ success: false, message: "Registration not found" });
  }

  if (registration.status !== "registered") {
    return res.status(400).json({ success: false, message: "Only an active registration can be cancelled" });
  }

  registration.status = "cancelled";
  await registration.save();

  if (registration.session) {
    await decreaseSessionCount(registration.session);
  } else {
    // Cancelling the expo also cancels the attendee's sessions in that expo
    const sessionRegistrations = await Registration.find({
      attendee: req.user._id,
      expo: registration.expo,
      session: { $ne: null },
      status: "registered",
    });

    for (const sessionRegistration of sessionRegistrations) {
      sessionRegistration.status = "cancelled";
      await sessionRegistration.save();
      await decreaseSessionCount(sessionRegistration.session);
    }
  }

  emitRegistrationsUpdated(registration.expo);

  res.status(200).json({ success: true, message: "Registration cancelled", registration });
};

// GET /api/registrations/my
export const getMyRegistrations = async (req, res) => {
  const registrations = await Registration.find({ attendee: req.user._id })
    .sort({ createdAt: -1 })
    .populate("expo", "title location startDate endDate status")
    .populate("session", "title type location startTime endTime status");

  res.status(200).json({ success: true, count: registrations.length, registrations });
};

// GET /api/expos/:expoId/registrations?status=registered
export const getExpoRegistrations = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const filter = { expo: expo._id, session: null };
  if (req.query.status) filter.status = req.query.status;

  const registrations = await Registration.find(filter)
    .sort({ createdAt: 1 })
    .populate("attendee", "name email phone");

  res.status(200).json({ success: true, count: registrations.length, registrations });
};
