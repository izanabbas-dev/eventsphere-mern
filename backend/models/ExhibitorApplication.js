import mongoose from "mongoose";

const exhibitorApplicationSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", required: true },
    message: { type: String, trim: true, default: "" },
    preferredBooths: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booth" }],
    assignedBooth: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "withdrawn"],
      default: "pending",
    },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

exhibitorApplicationSchema.index({ expo: 1, exhibitor: 1 }, { unique: true });

const ExhibitorApplication = mongoose.model("ExhibitorApplication", exhibitorApplicationSchema);
export default ExhibitorApplication;
