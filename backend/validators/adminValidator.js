import { body, param, query } from "express-validator";

const isSingleValue = (value) => typeof value === "string";

export const listUsersRules = [
  query("role")
    .optional()
    .custom(isSingleValue)
    .withMessage("Role must be a single value")
    .isIn(["admin", "exhibitor", "attendee"])
    .withMessage("Role must be admin, exhibitor or attendee"),
];

export const userStatusRules = [
  param("id").isMongoId().withMessage("Invalid user id"),
  body("isActive").isBoolean({ strict: true }).withMessage("isActive must be true or false").toBoolean(),
];
