import { body, param } from "express-validator";

export const startConversationRules = [
  body("userId").isMongoId().withMessage("Invalid user id"),
  body("expoId").isMongoId().withMessage("Invalid expo id"),
];

export const conversationIdRules = [param("id").isMongoId().withMessage("Invalid conversation id")];

export const sendMessageRules = [
  ...conversationIdRules,
  body("text")
    .isString()
    .withMessage("Message text is required")
    .trim()
    .notEmpty()
    .withMessage("Message text is required")
    .isLength({ max: 2000 })
    .withMessage("Message can be at most 2000 characters"),
];
