import path from "path";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Booth from "../models/Booth.js";
import Expo from "../models/Expo.js";
import User from "../models/User.js";
import {
  saveImage,
  saveDocument,
  getDocumentUrl,
  deleteFile,
  deletePrivateFile,
  discardFiles,
  PRIVATE_FOLDER,
} from "../middleware/upload.js";
import { saveBoothVisit } from "../utils/boothHelpers.js";
import { isAdmin, escapeRegex, canSeeContact } from "../utils/helpers.js";

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

const profileFields = ["companyName", "description", "category", "website", "productsServices"];
const contactFields = ["person", "email", "phone", "address"];

export const updateMyProfile = async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json({ success: false, message: "Exhibitor profile not found" });
  }

  profileFields.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  if (req.body.contact) {
    contactFields.forEach((field) => {
      if (req.body.contact[field] !== undefined) profile.contact[field] = req.body.contact[field];
    });
  }

  await profile.save();

  res.status(200).json({ success: true, message: "Profile updated", profile });
};

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

  const profiles = await ExhibitorProfile.find(filter).select("-documents").sort({ companyName: 1 }).lean();

  profiles.forEach((profile) => {
    const booth = bookedBooths.find((b) => b.exhibitor.equals(profile.user));
    profile.booth = booth ? { _id: booth._id, boothNumber: booth.boothNumber, hall: booth.hall, position: booth.position } : null;

    const owner = activeExhibitors.find((user) => user._id.equals(profile.user));
    applyContactPrivacy(req, profile, owner);
  });

  res.status(200).json({ success: true, count: profiles.length, exhibitors: profiles });
};

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

    if (booth && req.user && req.user.role === "attendee") {
      await saveBoothVisit(booth._id, expo._id, req.user._id, "profile_view");
    }
  }

  const profileData = applyContactPrivacy(req, profile.toObject(), exhibitor);
  const contactHidden = !canSeeContact(req, exhibitor);

  res.status(200).json({ success: true, name: exhibitor.name, profile: profileData, booth, contactHidden });
};

export const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please choose an image to upload" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });

  if (!profile) {
    await discardFiles([req.file]);
    return res.status(404).json({ success: false, message: "Exhibitor profile not found" });
  }

  const oldLogo = profile.logo;
  profile.logo = await saveImage(req.file, "logos");
  await profile.save();
  await deleteFile(oldLogo, req.user._id);

  res.status(200).json({ success: true, message: "Logo uploaded", logo: profile.logo });
};

export const uploadDocuments = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "Please choose at least one file to upload" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });

  if (!profile) {
    await discardFiles(req.files);
    return res.status(404).json({ success: false, message: "Exhibitor profile not found" });
  }

  for (const file of req.files) {
    profile.documents.push({ name: file.originalname, fileName: await saveDocument(file) });
  }
  await profile.save();

  res.status(200).json({ success: true, message: "Documents uploaded", documents: profile.documents });
};

export const downloadDocument = async (req, res) => {
  if (!isAdmin(req) && !req.user._id.equals(req.params.id)) {
    return res.status(403).json({ success: false, message: "You cannot download this document" });
  }

  const profile = await ExhibitorProfile.findOne({ user: req.params.id });
  const document = profile && profile.documents.id(req.params.docId);

  if (!document || !document.fileName) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const cloudUrl = getDocumentUrl(document.fileName);

  if (cloudUrl) {
    const response = await fetch(cloudUrl);
    if (!response.ok) {
      return res.status(404).json({ success: false, message: "File is missing on the server" });
    }

    res.attachment(document.name);
    res.type(response.headers.get("content-type") || "application/octet-stream");
    return res.send(Buffer.from(await response.arrayBuffer()));
  }

  const filePath = path.resolve(PRIVATE_FOLDER, path.basename(document.fileName));
  res.download(filePath, document.name, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ success: false, message: "File is missing on the server" });
    }
  });
};

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
