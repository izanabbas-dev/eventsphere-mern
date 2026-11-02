import api from "../api/axios";

// Each role has its own dashboard
export function getDashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "exhibitor") return "/exhibitor";
  return "/attendee";
}

// "Ali Khan" -> "AK"
export function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// Main error message from an axios error
export function getErrorMessage(error) {
  if (!error.response) return "Cannot reach the server. Please check your connection.";
  return error.response.data?.message || "Something went wrong. Please try again.";
}

// Backend validation errors [{ field, message }] -> { email: "...", password: "..." }
export function getFieldErrors(error) {
  const list = error.response?.data?.errors || [];
  const result = {};
  list.forEach((item) => {
    if (!result[item.field]) result[item.field] = item.message;
  });
  return result;
}

export function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

// Uploaded files are saved as "/uploads/abc.png" on the backend server
const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");

export function fileUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${SERVER_URL}${path}`;
}

// Dates are saved as UTC midnight, so show them in UTC to avoid a day shift
export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// For <input type="date">: "2026-03-12"
export function toInputDate(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

// Session times are shown in the user's local time
function pad(number) {
  return String(number).padStart(2, "0");
}

// Local day of a date: "2026-03-12"
export function toLocalDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// For <input type="datetime-local">: "2026-03-12T14:30"
export function toInputDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${toLocalDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "2:30 PM"
export function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// "2026-03-12" -> "Thu, 12 Mar 2026"
export function formatDayKey(key) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Every day of an expo: ["2026-03-12", "2026-03-13", ...]
export function getExpoDays(expo) {
  const days = [];
  const day = new Date(toInputDate(expo.startDate));
  const end = new Date(toInputDate(expo.endDate));
  while (day <= end) {
    days.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return days;
}

// Download a private file with the login token (a normal link cannot send the token)
export async function downloadFile(url, fileName) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) {
    // The error message also comes as a blob, so read it as JSON
    if (error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        error.response.data = {};
      }
    }
    throw error;
  }
}
