import { body, param, query } from "express-validator";

const statuses = ["pending", "approved", "rejected", "withdrawn"];

const isSingleValue = (value) => typeof value === "string";

const expoIdParamRules = [param("expoId").isMongoId().withMessage("Invalid expo id")];

export const applicationIdRules = [param("id").isMongoId().withMessage("Invalid application id")];

export const applyRules = [
  ...expoIdParamRules,
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message can be at most 1000 characters"),
  body("preferredBooths").optional().isArray({ max: 5 }).withMessage("Preferred booths must be a list of at most 5"),
  body("preferredBooths.*").isMongoId().withMessage("Invalid booth id in preferred booths"),
];

export const listApplicationRules = [
  ...expoIdParamRules,
  query("status")
    .optional()
    .custom(isSingleValue)
    .withMessage("Status must be a single value")
    .isIn(statuses)
    .withMessage("Invalid status"),
];

export const approveRules = [
  ...applicationIdRules,
  body("boothId").optional().isMongoId().withMessage("Invalid booth id"),
  body("adminNote").optional().isString().trim(),
];

export const rejectRules = [
  ...applicationIdRules,
  body("adminNote").trim().notEmpty().withMessage("Admin note is required when rejecting"),
];
