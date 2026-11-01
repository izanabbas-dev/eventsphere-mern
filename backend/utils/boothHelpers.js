import Booth from "../models/Booth.js";
import BoothVisit from "../models/BoothVisit.js";
import { emitBoothUpdated } from "./socket.js";

// Makes the booth available again and clears the exhibitor's details
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

// Any other booth this exhibitor already holds in the same expo
export const findOtherBooth = (expoId, exhibitorId, boothId) => {
  return Booth.findOne({ expo: expoId, exhibitor: exhibitorId, _id: { $ne: boothId } });
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
