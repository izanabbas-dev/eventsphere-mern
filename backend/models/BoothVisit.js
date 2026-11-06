import mongoose from "mongoose";

const boothVisitSchema = new mongoose.Schema(
  {
    booth: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", required: true },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, enum: ["profile_view", "floor_plan", "check_in"], default: "floor_plan" },
  },
  { timestamps: true }
);

boothVisitSchema.index({ expo: 1, booth: 1 });
boothVisitSchema.index({ booth: 1, visitor: 1, createdAt: -1 });

const BoothVisit = mongoose.model("BoothVisit", boothVisitSchema);
export default BoothVisit;
