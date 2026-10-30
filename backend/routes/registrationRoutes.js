import express from "express";
import { getMyRegistrations, cancelRegistration } from "../controllers/registrationController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { registrationIdRules } from "../validators/registrationValidator.js";

const router = express.Router();

// Expo and session registration routes are in expoRoutes.js and sessionRoutes.js

router.get("/my", protect, authorize("attendee"), getMyRegistrations);
router.delete("/:id", protect, authorize("attendee"), registrationIdRules, validate, cancelRegistration);

export default router;
