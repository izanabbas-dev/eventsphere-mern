export const isAdmin = (req) => req.user && req.user.role === "admin";

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isSingleValue = (value) => typeof value === "string";

export const defaultShowContact = (role) => role !== "attendee";

export const canSeeContact = (req, owner) => {
  if (isAdmin(req)) return true;
  if (req.user && req.user._id.equals(owner._id)) return true;
  if (typeof owner.showContactInfo === "boolean") return owner.showContactInfo;
  return defaultShowContact(owner.role);
};
