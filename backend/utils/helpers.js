export const isAdmin = (req) => req.user && req.user.role === "admin";

// Escapes special characters so search text is matched as plain text
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Default privacy setting when a user has not chosen one: exhibitors share their contact, attendees do not
export const defaultShowContact = (role) => role !== "attendee";

// The user's privacy setting, or the default for their role
export const showsContact = (user) => {
  if (typeof user.showContactInfo === "boolean") return user.showContactInfo;
  return defaultShowContact(user.role);
};

// Privacy: email and phone are shown to admins, to the owner, or to anyone when the owner allows it
export const canSeeContact = (req, owner) => {
  if (isAdmin(req)) return true;
  if (req.user && req.user._id.equals(owner._id)) return true;
  return showsContact(owner);
};
