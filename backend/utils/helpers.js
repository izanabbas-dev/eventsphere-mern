export const isAdmin = (req) => req.user && req.user.role === "admin";

// Escapes special characters so search text is matched as plain text
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
