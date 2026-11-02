import api from "./axios";

export async function fetchMyRegistrations() {
  const res = await api.get("/registrations/my");
  // Skip registrations whose expo was deleted
  return res.data.registrations.filter((registration) => registration.expo);
}

export async function fetchMyBookmarks() {
  const res = await api.get("/bookmarks/my");
  return res.data.bookmarks;
}

// My active registration for the whole expo (not a session), or undefined
export function findExpoRegistration(registrations, expoId) {
  return registrations.find(
    (registration) =>
      !registration.session && registration.expo._id === expoId && ["registered", "attended"].includes(registration.status)
  );
}
