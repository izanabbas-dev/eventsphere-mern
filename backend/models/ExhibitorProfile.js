import mongoose from "mongoose";

const exhibitorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, trim: true },
    productsServices: [{ type: String, trim: true }],
    website: { type: String, trim: true },
    contact: {
      person: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    // Saved in private_uploads, not served as public files
    documents: [
      {
        name: { type: String },
        fileName: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Used for keyword search of exhibitors
exhibitorProfileSchema.index({
  companyName: "text",
  description: "text",
  category: "text",
  productsServices: "text",
});

const ExhibitorProfile = mongoose.model("ExhibitorProfile", exhibitorProfileSchema);
export default ExhibitorProfile;
