import api from "../api/axios";
import { PASSWORD_MIN_LENGTH } from "./constants";

export function getDashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "exhibitor") return "/exhibitor";
  return "/attendee";
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

export function getErrorMessage(error) {
  if (!error.response) return "Cannot reach the server. Please check your connection.";
  return error.response.data?.message || "Something went wrong. Please try again.";
}

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

export function getPasswordRules(password) {
  return [
    { text: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { text: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { text: "One lowercase letter", ok: /[a-z]/.test(password) },
    { text: "One number", ok: /[0-9]/.test(password) },
  ];
}

export function getPasswordError(password) {
  const failed = getPasswordRules(password).find((rule) => !rule.ok);
  return failed ? `Password needs: ${failed.text.toLowerCase()}` : "";
}

const SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");

export function fileUrl(path) {
  if (!path) return "";
  return /^(https?:|blob:)/.test(path) ? path : `${SERVER_URL}${path}`;
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

export function toInputDate(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

function pad(number) {
  return String(number).padStart(2, "0");
}

export function toLocalDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toInputDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${toLocalDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDayKey(key) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

export function getProfileChecklist(profile) {
  return [
    { label: "Logo", done: Boolean(profile?.logo) },
    { label: "Description", done: Boolean(profile?.description?.trim()) },
    { label: "Products/services", done: profile?.productsServices?.length > 0 },
    { label: "Documents", done: profile?.documents?.length > 0 },
  ];
}

export async function downloadFile(url, fileName) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(res.data);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) {
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

export const emptySessionFilters = { day: "", type: "", topic: "", search: "" };

export function filterSessions(sessions, filters) {
  const search = filters.search.trim().toLowerCase();

  return sessions.filter((session) => {
    if (filters.day && toLocalDateKey(session.startTime) !== filters.day) return false;
    if (filters.type && session.type !== filters.type) return false;
    if (filters.topic && session.topic !== filters.topic) return false;
    if (search) {
      const inTitle = session.title.toLowerCase().includes(search);
      const inSpeakers = session.speakers.some((speaker) => speaker.name.toLowerCase().includes(search));
      if (!inTitle && !inSpeakers) return false;
    }
    return true;
  });
}

export function groupSessionsByDay(sessions) {
  const groups = {};
  [...sessions]
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .forEach((session) => {
      const key = toLocalDateKey(session.startTime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
  return groups;
}

export function formatSessionTime(session) {
  return `${formatDayKey(toLocalDateKey(session.startTime))} · ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`;
}

export function toWebsiteUrl(website) {
  if (!website) return "";
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatChatTime(date) {
  if (!date) return "";
  if (toLocalDateKey(date) === toLocalDateKey(new Date())) return formatTime(date);
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function getNotificationPath(link, role) {
  if (!link) return "";
  const [, first, id] = link.split("/");

  if (first === "chat") return `/${role}/messages?c=${id}`;
  if (first === "feedback") return `/${role}/feedback`;
  if (first === "applications") return role === "admin" ? "/admin/applications" : "/exhibitor/applications";
  if (first === "expos" && id) return `/${role}/expos/${id}`;
  if (first === "sessions") return role === "attendee" ? "/attendee/schedule" : `/${role}`;
  return link;
}
