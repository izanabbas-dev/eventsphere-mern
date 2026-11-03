import crypto from "crypto";
import User from "../models/User.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import sendEmail from "../utils/sendEmail.js";
import { defaultShowContact } from "../utils/helpers.js";

// Sends the token and user (without password) in one response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.generateToken();
  user.password = undefined;
  res.status(statusCode).json({ success: true, message, token, user });
};

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, phone, companyName } = req.body;
  const role = req.body.role || "attendee";

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Email is already registered" });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    showContactInfo: defaultShowContact(role),
    consent: { termsAccepted: true, acceptedAt: new Date() },
  });

  if (role === "exhibitor") {
    try {
      await ExhibitorProfile.create({ user: user._id, companyName });
    } catch (error) {
      // Don't keep a half-created exhibitor
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  sendTokenResponse(user, 201, res, "Registration successful");
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Your account has been disabled" });
  }

  sendTokenResponse(user, 200, res, "Login successful");
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  let profile = null;
  if (req.user.role === "exhibitor") {
    profile = await ExhibitorProfile.findOne({ user: req.user._id });
  }

  res.status(200).json({ success: true, user: req.user, profile });
};

// PUT /api/auth/me
// Only name, phone and the privacy setting can be changed here. Avatar is changed with POST /api/uploads/avatar.
export const updateMe = async (req, res) => {
  const { name, phone, showContactInfo } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (showContactInfo !== undefined) user.showContactInfo = showContactInfo;

  await user.save();

  res.status(200).json({ success: true, message: "Profile updated", user });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const message = "If this email is registered, a reset link has been sent";
  const user = await User.findOne({ email: req.body.email });

  // Same reply either way, so nobody can check which emails exist
  if (!user) {
    return res.status(200).json({ success: true, message });
  }

  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "EventSphere - Reset your password",
      text: `Hello ${user.name},\n\nClick the link below to reset your password. It is valid for 15 minutes.\n\n${resetUrl}\n\nIf you did not ask for this, ignore this email.`,
    });
  } catch (error) {
    // Log it, but send the same reply, so nobody can check which emails exist
    console.error("Email error:", error.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message });
};

// PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, "Password reset successful");
};

// PUT /api/auth/update-password
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, "Password updated successfully");
};
