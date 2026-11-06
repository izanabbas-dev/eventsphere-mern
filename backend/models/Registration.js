import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    attendee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
    ticketCode: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["registered", "cancelled", "attended"],
      default: "registered",
    },
  },
  { timestamps: true }
);

registrationSchema.index({ attendee: 1, expo: 1, session: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
