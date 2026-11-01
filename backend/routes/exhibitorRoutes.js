import express from "express";
import {
  updateMyProfile,
  getExhibitorProfile,
  uploadLogo,
  uploadDocuments,
  downloadDocument,
  deleteDocument,
} from "../controllers/exhibitorController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { uploadImage, uploadDocument } from "../middleware/upload.js";
import {
  updateProfileRules,
  exhibitorProfileRules,
  deleteDocumentRules,
  downloadDocumentRules,
} from "../validators/exhibitorValidator.js";

const router = express.Router();

router.put("/profile", protect, authorize("exhibitor"), updateProfileRules, validate, updateMyProfile);
router.post("/profile/logo", protect, authorize("exhibitor"), uploadImage.single("logo"), uploadLogo);
router.post("/profile/documents", protect, authorize("exhibitor"), uploadDocument.array("documents", 5), uploadDocuments);
router.delete("/profile/documents/:docId", protect, authorize("exhibitor"), deleteDocumentRules, validate, deleteDocument);

// Exhibitor list of an expo is in expoRoutes.js (/api/expos/:expoId/exhibitors)
router.get("/:id", optionalAuth, exhibitorProfileRules, validate, getExhibitorProfile);

// Owner check is done in the controller
router.get("/:id/documents/:docId", protect, authorize("admin", "exhibitor"), downloadDocumentRules, validate, downloadDocument);

export default router;
