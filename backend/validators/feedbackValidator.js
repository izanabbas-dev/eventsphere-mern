import { body, param, query } from "express-validator";

const types = ["suggestion", "issue", "complaint", "other"];
const statuses = ["open", "in_progress", "resolved"];

const isSingleValue = (value) => typeof value === "string";

export const createFeedbackRules = [
  body("type").isIn(types).withMessage(`Type must be one of: ${types.join(", ")}`),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5").toInt(),
  body("expoId").optional().isMongoId().withMessage("Invalid expo id"),
];

export const listFeedbackRules = [
  query("status")
    .optional()
    .custom(isSingleValue)
    .withMessage("Status must be a single value")
    .isIn(statuses)
    .withMessage("Invalid status"),
  query("type")
    .optional()
    .custom(isSingleValue)
    .withMessage("Type must be a single value")
    .isIn(types)
    .withMessage("Invalid type"),
];

export const updateFeedbackRules = [
  param("id").isMongoId().withMessage("Invalid feedback id"),
  body("status").optional().isIn(statuses).withMessage(`Status must be one of: ${statuses.join(", ")}`),
  body("adminResponse").optional().isString().trim(),
  body()
    .custom((value) => value.status !== undefined || value.adminResponse !== undefined)
    .withMessage("Send status or adminResponse"),
];
