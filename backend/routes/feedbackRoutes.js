import express from "express";
import { createFeedback, getMyFeedback, getAllFeedback, updateFeedback } from "../controllers/feedbackController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createFeedbackRules, listFeedbackRules, updateFeedbackRules } from "../validators/feedbackValidator.js";

const router = express.Router();

router.post("/", protect, createFeedbackRules, validate, createFeedback);
router.get("/my", protect, getMyFeedback);

router.get("/", protect, authorize("admin"), listFeedbackRules, validate, getAllFeedback);
router.patch("/:id", protect, authorize("admin"), updateFeedbackRules, validate, updateFeedback);

export default router;
