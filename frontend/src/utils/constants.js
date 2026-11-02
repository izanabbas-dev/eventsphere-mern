export const PASSWORD_MIN_LENGTH = 6;

export const EXHIBITOR_CATEGORIES = [
  "Technology",
  "Healthcare",
  "Education",
  "Food & Beverage",
  "Fashion & Lifestyle",
  "Automotive",
  "Finance",
  "Real Estate",
  "Manufacturing",
  "Other",
];

export const EXPO_STATUSES = ["draft", "published", "ongoing", "completed", "cancelled"];

// Same rules as the backend: which status an expo can move to from its current status
export const EXPO_NEXT_STATUSES = {
  draft: ["published", "cancelled"],
  published: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

export const BOOTH_SIZES = ["small", "medium", "large"];

export const CURRENCY = "Rs";

export const APPLICATION_STATUSES = ["pending", "approved", "rejected", "withdrawn"];

export const SESSION_TYPES = ["session", "workshop", "keynote", "panel"];

export const USER_ROLES = ["admin", "exhibitor", "attendee"];

export const FEEDBACK_TYPES = ["suggestion", "issue", "complaint", "other"];

export const FEEDBACK_STATUSES = ["open", "in_progress", "resolved"];
