import Booth from "../models/Booth.js";
import BoothVisit from "../models/BoothVisit.js";
import { emitBoothUpdated } from "./socket.js";

export const freeBooth = async (booth) => {
  booth.status = "available";
  booth.exhibitor = null;
  booth.productsShowcased = [];
  booth.staff = [];
  await booth.save();
  emitBoothUpdated(booth);
};

export const freeExhibitorBooths = async (expoId, exhibitorId) => {
  const booths = await Booth.find({ expo: expoId, exhibitor: exhibitorId });
  for (const booth of booths) {
    await freeBooth(booth);
  }
  return booths;
};

export const findOtherBooth = (expoId, exhibitorId, boothId) => {
  return Booth.findOne({ expo: expoId, exhibitor: exhibitorId, _id: { $ne: boothId } });
};

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
