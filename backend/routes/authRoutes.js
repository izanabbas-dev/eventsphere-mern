import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter.js";
import {
  registerRules,
  loginRules,
  updateMeRules,
  forgotPasswordRules,
  resetPasswordRules,
  updatePasswordRules,
} from "../validators/authValidator.js";

const router = express.Router();

router.post("/register", registerLimiter, registerRules, validate, register);
router.post("/login", loginLimiter, loginRules, validate, login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMeRules, validate, updateMe);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordRules, validate, forgotPassword);
router.put("/reset-password/:token", resetPasswordRules, validate, resetPassword);
router.put("/update-password", protect, updatePasswordRules, validate, updatePassword);

export default router;
