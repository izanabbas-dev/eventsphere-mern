import Booth from "../models/Booth.js";
import BoothVisit from "../models/BoothVisit.js";
import { emitBoothUpdated } from "./socket.js";

// Makes one booth available again and removes the exhibitor's booth details
export const freeBooth = async (booth) => {
  booth.status = "available";
  booth.exhibitor = null;
  booth.productsShowcased = [];
  booth.staff = [];
  await booth.save();
  emitBoothUpdated(booth);
};

// Frees every booth (reserved or booked) that this exhibitor holds in this expo
export const freeExhibitorBooths = async (expoId, exhibitorId) => {
  const booths = await Booth.find({ expo: expoId, exhibitor: exhibitorId });
  for (const booth of booths) {
    await freeBooth(booth);
  }
  return booths;
};

// Saves a booth visit, but only once per user per booth per hour.
// Returns the new visit, or null if it was already counted.
export const saveBoothVisit = async (boothId, expoId, visitorId, source) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const alreadyCounted = await BoothVisit.exists({
    booth: boothId,
    visitor: visitorId,
    createdAt: { $gte: oneHourAgo },
  });
  if (alreadyCounted) return null;

  return BoothVisit.create({ booth: boothId, expo: expoId, visitor: visitorId, source });
};
