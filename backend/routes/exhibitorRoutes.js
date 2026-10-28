import express from "express";
import { updateMyProfile } from "../controllers/exhibitorController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { updateProfileRules } from "../validators/exhibitorValidator.js";

const router = express.Router();

router.put("/profile", protect, authorize("exhibitor"), updateProfileRules, validate, updateMyProfile);

export default router;
