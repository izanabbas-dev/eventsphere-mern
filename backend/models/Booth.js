import mongoose from "mongoose";

const boothSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true },
    boothNumber: { type: String, required: true, trim: true },
    position: {
      row: { type: Number, required: true, min: 0 },
      col: { type: Number, required: true, min: 0 },
    },
    size: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    price: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["available", "reserved", "booked"],
      default: "available",
    },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    productsShowcased: [{ type: String, trim: true }],
    staff: [
      {
        name: { type: String },
        role: { type: String },
        phone: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// A booth number can only be used once inside the same expo
boothSchema.index({ expo: 1, boothNumber: 1 }, { unique: true });

// Two booths cannot use the same spot on the floor plan
boothSchema.index({ expo: 1, "position.row": 1, "position.col": 1 }, { unique: true });

const Booth = mongoose.model("Booth", boothSchema);
export default Booth;
