import api from "./axios";

export async function fetchMyRegistrations() {
  const res = await api.get("/registrations/my");
  return res.data.registrations.filter((registration) => registration.expo);
}

export async function fetchMyBookmarks() {
  const res = await api.get("/bookmarks/my");
  return res.data.bookmarks;
}

export function findExpoRegistration(registrations, expoId) {
  return registrations.find(
    (registration) =>
      !registration.session && registration.expo._id === expoId && ["registered", "attended"].includes(registration.status)
  );
}
