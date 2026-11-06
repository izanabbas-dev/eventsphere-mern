import express from "express";
import {
  createExpo,
  getExpos,
  getExpo,
  updateExpo,
  deleteExpo,
  updateExpoStatus,
  uploadExpoBanner,
} from "../controllers/expoController.js";
import { createBooth, getBooths } from "../controllers/boothController.js";
import { applyToExpo, getExpoApplications } from "../controllers/applicationController.js";
import { createSession, getSessions } from "../controllers/sessionController.js";
import { registerForExpo, getExpoRegistrations } from "../controllers/registrationController.js";
import { getExpoExhibitors } from "../controllers/exhibitorController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { uploadImage } from "../middleware/upload.js";
import {
  expoIdRules,
  listExpoRules,
  createExpoRules,
  updateExpoRules,
  updateStatusRules,
} from "../validators/expoValidator.js";
import { listBoothRules, createBoothRules } from "../validators/boothValidator.js";
import { applyRules, listApplicationRules } from "../validators/applicationValidator.js";
import { listSessionRules, createSessionRules } from "../validators/sessionValidator.js";
import { expoIdParamRules, listRegistrationRules } from "../validators/registrationValidator.js";
import { listExhibitorRules } from "../validators/exhibitorValidator.js";

const router = express.Router();

router.get("/", optionalAuth, listExpoRules, validate, getExpos);
router.get("/:id", optionalAuth, expoIdRules, validate, getExpo);

router.post("/", protect, authorize("admin"), createExpoRules, validate, createExpo);
router.put("/:id", protect, authorize("admin"), updateExpoRules, validate, updateExpo);
router.delete("/:id", protect, authorize("admin"), expoIdRules, validate, deleteExpo);
router.patch("/:id/status", protect, authorize("admin"), updateStatusRules, validate, updateExpoStatus);
router.post("/:id/banner", protect, authorize("admin"), expoIdRules, validate, uploadImage.single("banner"), uploadExpoBanner);

router.get("/:expoId/booths", optionalAuth, listBoothRules, validate, getBooths);
router.post("/:expoId/booths", protect, authorize("admin"), createBoothRules, validate, createBooth);

router.post("/:expoId/applications", protect, authorize("exhibitor"), applyRules, validate, applyToExpo);
router.get("/:expoId/applications", protect, authorize("admin"), listApplicationRules, validate, getExpoApplications);

router.get("/:expoId/sessions", optionalAuth, listSessionRules, validate, getSessions);
router.post("/:expoId/sessions", protect, authorize("admin"), createSessionRules, validate, createSession);

router.post("/:expoId/register", protect, authorize("attendee"), expoIdParamRules, validate, registerForExpo);
router.get("/:expoId/registrations", protect, authorize("admin"), listRegistrationRules, validate, getExpoRegistrations);

router.get("/:expoId/exhibitors", optionalAuth, listExhibitorRules, validate, getExpoExhibitors);

export default router;
