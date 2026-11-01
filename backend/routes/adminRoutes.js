import express from "express";
import { getUsers, updateUserStatus } from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { listUsersRules, userStatusRules } from "../validators/adminValidator.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", listUsersRules, validate, getUsers);
router.patch("/users/:id/status", userStatusRules, validate, updateUserStatus);

export default router;
