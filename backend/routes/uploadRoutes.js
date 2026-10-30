import express from "express";
import { uploadAvatar } from "../controllers/uploadController.js";
import { protect } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";

const router = express.Router();

router.post("/avatar", protect, uploadImage.single("avatar"), uploadAvatar);

export default router;
