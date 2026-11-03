import path from "path";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Booth from "../models/Booth.js";
import Expo from "../models/Expo.js";
import User from "../models/User.js";
import { getFileUrl, deleteFile, deletePrivateFile, PRIVATE_FOLDER } from "../middleware/upload.js";
import { saveBoothVisit } from "../utils/boothHelpers.js";
import { isAdmin, escapeRegex, canSeeContact } from "../utils/helpers.js";

// Public contact of a profile (plain object). An empty company email or phone falls back
// to the exhibitor's account email and phone. Both are removed when the owner hides them.
const applyContactPrivacy = (req, profile, owner) => {
  const contact = profile.contact || {};

  if (!canSeeContact(req, owner)) {
    profile.contact = { ...contact, email: undefined, phone: undefined };
  } else {
    profile.contact = {
      ...contact,
      email: contact.email || owner.email,
      phone: contact.phone || owner.phone || "",
    };
  }
  return profile;
};

// Logo is changed with POST /api/exhibitors/profile/logo, not here
const profileFields = ["companyName", "description", "category", "website", "productsServices"];
const contactFields = ["person", "email", "phone", "address"];

// PUT /api/exhibitors/profile
export const updateMyProfile = async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json({ success: false, message: "Exhibitor profile not found" });
  }

  profileFields.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  // Update only the contact fields that were sent, keep the others
  if (req.body.contact) {
    contactFields.forEach((field) => {
      if (req.body.contact[field] !== undefined) profile.contact[field] = req.body.contact[field];
    });
  }

  await profile.save();

  res.status(200).json({ success: true, message: "Profile updated", profile });
};

// GET /api/expos/:expoId/exhibitors?search=iot&category=Technology
// Exhibitors with an approved application or a booked booth in this expo
export const getExpoExhibitors = async (req, res) => {
  const expo = await Expo.findById(req.params.expoId);

  if (!expo || (expo.status === "draft" && !isAdmin(req))) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  const approvedApplications = await ExhibitorApplication.find({ expo: expo._id, status: "approved" }).select("exhibitor");
  const bookedBooths = await Booth.find({ expo: expo._id, status: "booked" }).select("boothNumber hall position exhibitor");

  const exhibitorIds = [
    ...approvedApplications.map((application) => application.exhibitor),
    ...bookedBooths.map((booth) => booth.exhibitor),
  ];

  // Skip disabled accounts
  const activeExhibitors = await User.find({ _id: { $in: exhibitorIds }, role: "exhibitor", isActive: true }).select(
    "_id role email phone showContactInfo"
  );

  const filter = { user: { $in: activeExhibitors.map((user) => user._id) } };

  const { search, category } = req.query;

  if (category) {
    filter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
  }

  if (search) {
    const searchRegex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ companyName: searchRegex }, { description: searchRegex }, { productsServices: searchRegex }];
  }

  // Documents are private, so they are not sent
  const profiles = await ExhibitorProfile.find(filter).select("-documents").sort({ companyName: 1 }).lean();

  profiles.forEach((profile) => {
    const booth = bookedBooths.find((b) => b.exhibitor.equals(profile.user));
    profile.booth = booth ? { _id: booth._id, boothNumber: booth.boothNumber, hall: booth.hall, position: booth.position } : null;

    const owner = activeExhibitors.find((user) => user._id.equals(profile.user));
    applyContactPrivacy(req, profile, owner);
  });

  res.status(200).json({ success: true, count: profiles.length, exhibitors: profiles });
};

// GET /api/exhibitors/:id?expoId=...
// :id is the exhibitor's user id. With expoId, their booth in that expo is also sent.
export const getExhibitorProfile = async (req, res) => {
  const exhibitor = await User.findById(req.params.id);

  if (!exhibitor || exhibitor.role !== "exhibitor" || !exhibitor.isActive) {
    return res.status(404).json({ success: false, message: "Exhibitor not found" });
  }

  const profile = await ExhibitorProfile.findOne({ user: exhibitor._id }).select("-documents");

  if (!profile) {
    return res.status(404).json({ success: false, message: "Exhibitor not found" });
  }

  let booth = null;

  if (req.query.expoId) {
    const expo = await Expo.findById(req.query.expoId);

    if (!expo || (expo.status === "draft" && !isAdmin(req))) {
      return res.status(404).json({ success: false, message: "Expo not found" });
    }

    booth = await Booth.findOne({ expo: expo._id, exhibitor: exhibitor._id, status: "booked" }).select(
      "boothNumber hall position size"
    );

    // Count this view as a booth visit when an attendee opens the profile
    if (booth && req.user && req.user.role === "attendee") {
      await saveBoothVisit(booth._id, expo._id, req.user._id, "profile_view");
    }
  }

  const profileData = applyContactPrivacy(req, profile.toObject(), exhibitor);
  const contactHidden = !canSeeContact(req, exhibitor);

  res.status(200).json({ success: true, name: exhibitor.name, profile: profileData, booth, contactHidden });
};

// POST /api/exhibitors/profile/logo  (form-data field: logo)
export const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please choose an image to upload" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });

  if (!profile) {
    await deleteFile(getFileUrl(req.file), req.user._id);
    return res.status(404).json({ success: false, message: "Exhibitor profile not found" });
  }

  const oldLogo = profile.logo;
  profile.logo = getFileUrl(req.file);
  await profile.save();
  await deleteFile(oldLogo, req.user._id);

  res.status(200).json({ success: true, message: "Logo uploaded", logo: profile.logo });
};

// POST /api/exhibitors/profile/documents  (form-data field: documents, up to 5 files)
export const uploadDocuments = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "Please choose at least one file to upload" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });

  if (!profile) {
    for (const file of req.files) await deletePrivateFile(file.filename);
    return res.status(404).json({ success: false, message: "Exhibitor profile not found" });
  }

  req.files.forEach((file) => {
    profile.documents.push({ name: file.originalname, fileName: file.filename });
  });
  await profile.save();

  res.status(200).json({ success: true, message: "Documents uploaded", documents: profile.documents });
};

// GET /api/exhibitors/:id/documents/:docId
// :id is the exhibitor's user id. Only that exhibitor or an admin can download.
export const downloadDocument = async (req, res) => {
  if (!isAdmin(req) && !req.user._id.equals(req.params.id)) {
    return res.status(403).json({ success: false, message: "You cannot download this document" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.params.id });
  const document = profile && profile.documents.id(req.params.docId);

  if (!document || !document.fileName) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const filePath = path.resolve(PRIVATE_FOLDER, path.basename(document.fileName));
  res.download(filePath, document.name, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ success: false, message: "File is missing on the server" });
    }
  });
};

// DELETE /api/exhibitors/profile/documents/:docId
export const deleteDocument = async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  const document = profile && profile.documents.id(req.params.docId);

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const fileName = document.fileName;
  document.deleteOne();
  await profile.save();
  await deletePrivateFile(fileName);

  res.status(200).json({ success: true, message: "Document deleted", documents: profile.documents });
};
