import express from "express";
import {
  updateBooth,
  deleteBooth,
  assignBooth,
  unassignBooth,
  reserveBooth,
  cancelReservation,
  updateBoothDetails,
  recordBoothVisit,
} from "../controllers/boothController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  boothIdRules,
  updateBoothRules,
  assignBoothRules,
  boothDetailsRules,
  boothVisitRules,
} from "../validators/boothValidator.js";

const router = express.Router();

// Create and list booths are in expoRoutes.js (/api/expos/:expoId/booths)

router.put("/:id", protect, authorize("admin"), updateBoothRules, validate, updateBooth);
router.delete("/:id", protect, authorize("admin"), boothIdRules, validate, deleteBooth);
router.patch("/:id/assign", protect, authorize("admin"), assignBoothRules, validate, assignBooth);
router.patch("/:id/unassign", protect, authorize("admin"), boothIdRules, validate, unassignBooth);

router.post("/:id/reserve", protect, authorize("exhibitor"), boothIdRules, validate, reserveBooth);
router.delete("/:id/reserve", protect, authorize("exhibitor"), boothIdRules, validate, cancelReservation);
router.put("/:id/details", protect, authorize("exhibitor"), boothDetailsRules, validate, updateBoothDetails);

// Any logged-in user
router.post("/:id/visit", protect, boothVisitRules, validate, recordBoothVisit);

export default router;
