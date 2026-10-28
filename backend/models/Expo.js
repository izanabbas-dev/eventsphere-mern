import mongoose from "mongoose";

const expoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    theme: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be after the start date",
      },
    },
    location: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "cancelled"],
      default: "draft",
    },
    floorPlan: {
      rows: { type: Number, default: 5, min: 1 },
      cols: { type: Number, default: 5, min: 1 },
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Expo = mongoose.model("Expo", expoSchema);
export default Expo;
