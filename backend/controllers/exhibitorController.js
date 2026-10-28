import ExhibitorProfile from "../models/ExhibitorProfile.js";

const profileFields = ["companyName", "logo", "description", "category", "website", "productsServices"];
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
