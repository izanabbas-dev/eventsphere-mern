import api from "./axios";

export async function fetchMyProfile() {
  const res = await api.get("/auth/me");
  return res.data.profile;
}

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
