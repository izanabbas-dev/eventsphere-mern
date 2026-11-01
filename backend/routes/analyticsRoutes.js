import express from "express";
import { getExpoReport, getOverview } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { expoReportRules } from "../validators/analyticsValidator.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/overview", getOverview);
router.get("/expos/:expoId", expoReportRules, validate, getExpoReport);

export default router;
