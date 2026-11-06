import express from "express";
import { getSession, updateSession, cancelSession, deleteSession } from "../controllers/sessionController.js";
import { registerForSession } from "../controllers/registrationController.js";
import { addBookmark, removeBookmark } from "../controllers/bookmarkController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { sessionIdRules, updateSessionRules } from "../validators/sessionValidator.js";
import { addBookmarkRules } from "../validators/bookmarkValidator.js";

const router = express.Router();

router.get("/:id", optionalAuth, sessionIdRules, validate, getSession);

router.put("/:id", protect, authorize("admin"), updateSessionRules, validate, updateSession);
router.patch("/:id/cancel", protect, authorize("admin"), sessionIdRules, validate, cancelSession);
router.delete("/:id", protect, authorize("admin"), sessionIdRules, validate, deleteSession);

router.post("/:id/register", protect, authorize("attendee"), sessionIdRules, validate, registerForSession);
router.post("/:id/bookmark", protect, authorize("attendee"), addBookmarkRules, validate, addBookmark);
router.delete("/:id/bookmark", protect, authorize("attendee"), sessionIdRules, validate, removeBookmark);

export default router;
