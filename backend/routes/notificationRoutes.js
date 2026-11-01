import express from "express";
import { getMyNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { notificationIdRules } from "../validators/notificationValidator.js";

const router = express.Router();

router.get("/my", protect, getMyNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, notificationIdRules, validate, markAsRead);

export default router;
