import express from "express";
import {
  createExpo,
  getExpos,
  getExpo,
  updateExpo,
  deleteExpo,
  updateExpoStatus,
} from "../controllers/expoController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  expoIdRules,
  listExpoRules,
  createExpoRules,
  updateExpoRules,
  updateStatusRules,
} from "../validators/expoValidator.js";

const router = express.Router();

router.get("/", optionalAuth, listExpoRules, validate, getExpos);
router.get("/:id", optionalAuth, expoIdRules, validate, getExpo);

router.post("/", protect, authorize("admin"), createExpoRules, validate, createExpo);
router.put("/:id", protect, authorize("admin"), updateExpoRules, validate, updateExpo);
router.delete("/:id", protect, authorize("admin"), expoIdRules, validate, deleteExpo);
router.patch("/:id/status", protect, authorize("admin"), updateStatusRules, validate, updateExpoStatus);

export default router;
