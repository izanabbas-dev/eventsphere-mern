import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", default: null },
    type: {
      type: String,
      enum: ["suggestion", "issue", "complaint", "other"],
      default: "other",
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    adminResponse: { type: String, default: "" },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
