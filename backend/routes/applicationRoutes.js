import express from "express";
import {
  getMyApplications,
  withdrawApplication,
  getApplication,
  approveApplication,
  rejectApplication,
} from "../controllers/applicationController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { applicationIdRules, approveRules, rejectRules } from "../validators/applicationValidator.js";

const router = express.Router();

// Apply and list by expo are in expoRoutes.js (/api/expos/:expoId/applications)

// "/my" must stay above "/:id"
router.get("/my", protect, authorize("exhibitor"), getMyApplications);
router.patch("/:id/withdraw", protect, authorize("exhibitor"), applicationIdRules, validate, withdrawApplication);

router.get("/:id", protect, authorize("admin"), applicationIdRules, validate, getApplication);
router.patch("/:id/approve", protect, authorize("admin"), approveRules, validate, approveApplication);
router.patch("/:id/reject", protect, authorize("admin"), rejectRules, validate, rejectApplication);

export default router;
