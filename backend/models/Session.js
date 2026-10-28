import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    topic: { type: String, trim: true },
    type: {
      type: String,
      enum: ["keynote", "talk", "workshop", "panel", "other"],
      default: "talk",
    },
    speakers: [
      {
        name: { type: String, required: true },
        bio: { type: String },
        photo: { type: String },
      },
    ],
    location: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startTime || value > this.startTime;
        },
        message: "End time must be after the start time",
      },
    },
    capacity: { type: Number, default: 50, min: 1 },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
