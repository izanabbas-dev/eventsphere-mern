import express from "express";
import { getMyBookmarks } from "../controllers/bookmarkController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/my", protect, authorize("attendee"), getMyBookmarks);

export default router;
