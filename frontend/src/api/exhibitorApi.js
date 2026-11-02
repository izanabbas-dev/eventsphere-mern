import api from "./axios";

// My company profile (with private documents) comes from /auth/me
export async function fetchMyProfile() {
  const res = await api.get("/auth/me");
  return res.data.profile;
}

// There is no "my booths" route, so check the floor plan of every expo
// and keep the booths that belong to me (reserved or booked)
export async function fetchMyBooths(userId) {
  const exposRes = await api.get("/expos");
  const expos = exposRes.data.expos.filter((expo) => expo.status !== "cancelled");

  const results = await Promise.all(expos.map((expo) => api.get(`/expos/${expo._id}/booths`)));

  return results.flatMap((res, i) =>
    res.data.booths
      .filter((booth) => booth.exhibitor?._id === userId)
      .map((booth) => ({ ...booth, expo: expos[i] }))
  );
}
