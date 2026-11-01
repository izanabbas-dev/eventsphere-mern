import Booth from "../models/Booth.js";
import Expo from "../models/Expo.js";
import User from "../models/User.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import { emitBoothUpdated } from "../utils/socket.js";
import { createNotification } from "../utils/notify.js";
import { freeBooth, saveBoothVisit } from "../utils/boothHelpers.js";

const isAdmin = (req) => req.user && req.user.role === "admin";

// Returns an error message if the spot is outside the floor plan or already used, otherwise null.
// Rows and cols start from 0, so a 5x5 floor plan has rows 0-4 and cols 0-4.
const getPositionError = async (expo, row, col, boothId) => {
  if (row >= expo.floorPlan.rows || col >= expo.floorPlan.cols) {
    return `Position must be inside the floor plan (row 0-${expo.floorPlan.rows - 1}, col 0-${expo.floorPlan.cols - 1})`;
  }

  const filter = { expo: expo._id, "position.row": row, "position.col": col };
  if (boothId) filter._id = { $ne: boothId };

  const takenBooth = await Booth.findOne(filter);
  if (takenBooth) {
    return `Position is already used by booth ${takenBooth.boothNumber}`;
  }

  return null;
};

const isBoothNumberTaken = async (expoId, boothNumber, boothId) => {
  const filter = { expo: expoId, boothNumber };
  if (boothId) filter._id = { $ne: boothId };
  return Booth.exists(filter);
};

// POST /api/expos/:expoId/booths
export const createBooth = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const { boothNumber, hall, position, size, price } = req.body;

  if (await isBoothNumberTaken(expo._id, boothNumber)) {
    return res.status(400).json({ success: false, message: `Booth number ${boothNumber} already exists in this expo` });
  }

  const positionError = await getPositionError(expo, position.row, position.col);
  if (positionError) {
    return res.status(400).json({ success: false, message: positionError });
  }

  const booth = await Booth.create({
    expo: expo._id,
    boothNumber,
    hall,
    position: { row: position.row, col: position.col },
    size,
    price,
  });

  emitBoothUpdated(booth, "created");

  res.status(201).json({ success: true, message: "Booth created", booth });
};

// GET /api/expos/:expoId/booths?status=available
// Floor plan data: every booth with its status and the exhibitor's company name
export const getBooths = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo || (expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const filter = { expo: expo._id };
  if (req.query.status) filter.status = req.query.status;

  // Staff phone numbers are private, so only admins see them here
  const hiddenFields = isAdmin(req) ? "" : "-staff";

  const booths = await Booth.find(filter)
    .select(hiddenFields)
    .sort({ "position.row": 1, "position.col": 1 })
    .populate("exhibitor", "name")
    .lean();

  // Company names are saved in ExhibitorProfile, not in User
  const exhibitorIds = booths.filter((booth) => booth.exhibitor).map((booth) => booth.exhibitor._id);
  const profiles = await ExhibitorProfile.find({ user: { $in: exhibitorIds } }).select("user companyName");

  booths.forEach((booth) => {
    const profile = booth.exhibitor && profiles.find((p) => p.user.equals(booth.exhibitor._id));
    booth.companyName = profile ? profile.companyName : null;
  });

  res.status(200).json({ success: true, count: booths.length, floorPlan: expo.floorPlan, booths });
};

// PUT /api/booths/:id
export const updateBooth = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  const { boothNumber, hall, position, size, price } = req.body;

  if (boothNumber !== undefined) {
    if (await isBoothNumberTaken(booth.expo, boothNumber, booth._id)) {
      return res.status(400).json({ success: false, message: `Booth number ${boothNumber} already exists in this expo` });
    }
    booth.boothNumber = boothNumber;
  }

  if (position) {
    const row = position.row !== undefined ? position.row : booth.position.row;
    const col = position.col !== undefined ? position.col : booth.position.col;

    const expo = await Expo.findById(booth.expo);
    const positionError = await getPositionError(expo, row, col, booth._id);
    if (positionError) {
      return res.status(400).json({ success: false, message: positionError });
    }

    booth.position.row = row;
    booth.position.col = col;
  }

  if (hall !== undefined) booth.hall = hall;
  if (size !== undefined) booth.size = size;
  if (price !== undefined) booth.price = price;

  await booth.save();
  emitBoothUpdated(booth);

  res.status(200).json({ success: true, message: "Booth updated", booth });
};

// DELETE /api/booths/:id
export const deleteBooth = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  if (booth.status === "booked") {
    return res.status(400).json({ success: false, message: "A booked booth cannot be deleted" });
  }

  await booth.deleteOne();
  emitBoothUpdated(booth, "deleted");

  // Tell the exhibitor that their reservation is gone
  if (booth.status === "reserved" && booth.exhibitor) {
    await createNotification({
      user: booth.exhibitor,
      title: "Booth reservation removed",
      message: `Booth ${booth.boothNumber} was removed by the organizer. Please reserve another booth.`,
      type: "info",
      link: `/expos/${booth.expo}`,
    });
  }

  res.status(200).json({ success: true, message: "Booth deleted" });
};

// PATCH /api/booths/:id/assign
// Admin can assign an available booth, or confirm a booth reserved by the same exhibitor
export const assignBooth = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  const exhibitor = await User.findById(req.body.exhibitorId);

  if (!exhibitor || exhibitor.role !== "exhibitor" || !exhibitor.isActive) {
    return res.status(400).json({ success: false, message: "Exhibitor not found" });
  }

  if (booth.status === "booked") {
    return res.status(400).json({ success: false, message: "Booth is already booked" });
  }

  if (booth.status === "reserved" && !booth.exhibitor.equals(exhibitor._id)) {
    return res.status(400).json({ success: false, message: "Booth is reserved by another exhibitor" });
  }

  const otherBooth = await Booth.findOne({ expo: booth.expo, exhibitor: exhibitor._id, _id: { $ne: booth._id } });
  if (otherBooth) {
    return res.status(400).json({
      success: false,
      message: `This exhibitor already holds booth ${otherBooth.boothNumber} in this expo`,
    });
  }

  booth.exhibitor = exhibitor._id;
  booth.status = "booked";
  await booth.save();
  emitBoothUpdated(booth);

  // Link the booth to this exhibitor's application for the expo, if they applied
  await ExhibitorApplication.findOneAndUpdate(
    { expo: booth.expo, exhibitor: exhibitor._id, status: { $in: ["pending", "approved"] } },
    { assignedBooth: booth._id }
  );

  res.status(200).json({ success: true, message: `Booth assigned to ${exhibitor.name}`, booth });
};

// PATCH /api/booths/:id/unassign
// Admin makes a booked or reserved booth available again
export const unassignBooth = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  if (booth.status === "available" || !booth.exhibitor) {
    return res.status(400).json({ success: false, message: "Booth is already available" });
  }

  const exhibitorId = booth.exhibitor;
  await freeBooth(booth);

  await ExhibitorApplication.updateOne(
    { expo: booth.expo, exhibitor: exhibitorId, assignedBooth: booth._id },
    { assignedBooth: null }
  );

  await createNotification({
    user: exhibitorId,
    title: "Booth unassigned",
    message: `Booth ${booth.boothNumber} is no longer assigned to you. Please contact the organizer for details.`,
    type: "application",
    link: "/applications/my",
  });

  res.status(200).json({ success: true, message: "Booth is available again", booth });
};

// POST /api/booths/:id/reserve
export const reserveBooth = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  const expo = await Expo.findById(booth.expo);

  if (!expo || !["published", "ongoing"].includes(expo.status)) {
    return res.status(400).json({ success: false, message: "Booths can only be reserved for published or ongoing expos" });
  }

  if (booth.status !== "available") {
    return res.status(400).json({ success: false, message: "Booth is not available" });
  }

  const myBooth = await Booth.findOne({ expo: booth.expo, exhibitor: req.user._id });
  if (myBooth) {
    return res.status(400).json({ success: false, message: `You already hold booth ${myBooth.boothNumber} in this expo` });
  }

  // Update only if still available, so two exhibitors cannot reserve the same booth at once
  const reservedBooth = await Booth.findOneAndUpdate(
    { _id: booth._id, status: "available" },
    { status: "reserved", exhibitor: req.user._id },
    { returnDocument: "after" }
  );

  if (!reservedBooth) {
    return res.status(400).json({ success: false, message: "Booth was just taken by someone else" });
  }

  emitBoothUpdated(reservedBooth);

  res.status(200).json({ success: true, message: "Booth reserved", booth: reservedBooth });
};

// DELETE /api/booths/:id/reserve
export const cancelReservation = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  if (booth.status !== "reserved" || !booth.exhibitor || !booth.exhibitor.equals(req.user._id)) {
    return res.status(400).json({ success: false, message: "You do not have a reservation on this booth" });
  }

  await freeBooth(booth);

  res.status(200).json({ success: true, message: "Reservation cancelled", booth });
};

// PUT /api/booths/:id/details
export const updateBoothDetails = async (req, res) => {
  const booth = await Booth.findById(req.params.id);

  if (!booth) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  if (!booth.exhibitor || !booth.exhibitor.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: "You can only update your own booth" });
  }

  if (req.body.productsShowcased !== undefined) booth.productsShowcased = req.body.productsShowcased;

  if (req.body.staff !== undefined) {
    booth.staff = req.body.staff.map((member) => ({
      name: member.name,
      role: member.role,
      phone: member.phone,
    }));
  }

  await booth.save();

  res.status(200).json({ success: true, message: "Booth details updated", booth });
};

// POST /api/booths/:id/visit
// Saves one visit so booth traffic can be shown in the analytics report (once per user per booth per hour)
export const recordBoothVisit = async (req, res) => {
  const booth = await Booth.findById(req.params.id).populate("expo", "status");

  if (!booth || !booth.expo || (booth.expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Booth not found" });
  }

  const visit = await saveBoothVisit(booth._id, booth.expo._id, req.user._id, req.body.source || "floor_plan");

  if (!visit) {
    return res.status(200).json({ success: true, message: "Visit already counted in the last hour" });
  }

  res.status(201).json({ success: true, message: "Visit recorded", visit });
};
