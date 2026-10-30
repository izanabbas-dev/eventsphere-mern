import express from "express";
import {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  startConversationRules,
  conversationIdRules,
  sendMessageRules,
} from "../validators/conversationValidator.js";

const router = express.Router();

// Any logged-in user. Role rules are checked in the controller.
router.post("/", protect, startConversationRules, validate, startConversation);
router.get("/my", protect, getMyConversations);
router.get("/:id/messages", protect, conversationIdRules, validate, getMessages);
router.post("/:id/messages", protect, sendMessageRules, validate, sendMessage);

export default router;
