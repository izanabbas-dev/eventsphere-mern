import express from "express";
import { getMyBookmarks } from "../controllers/bookmarkController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Add and remove bookmark routes are in sessionRoutes.js (/api/sessions/:id/bookmark)

router.get("/my", protect, authorize("attendee"), getMyBookmarks);

export default router;
