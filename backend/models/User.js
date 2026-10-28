import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["admin", "exhibitor", "attendee"],
      default: "attendee",
    },
    phone: { type: String, trim: true },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    consent: {
      termsAccepted: { type: Boolean, default: false },
      acceptedAt: { type: Date },
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash the password only when it is new or changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);

  // 1 second back, so the new token made right after this save is still valid
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

// True if the password was changed after this token was created
userSchema.methods.changedPasswordAfter = function (tokenIssuedAt) {
  if (!this.passwordChangedAt) return false;
  return tokenIssuedAt < Math.floor(this.passwordChangedAt.getTime() / 1000);
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Returns the plain token (to send by email); only the hashed version is saved
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;
