import { body, param, query } from "express-validator";

export const listUsersRules = [
  query("role")
    .optional()
    .custom((value) => typeof value === "string")
    .withMessage("Role must be a single value")
    .isIn(["admin", "exhibitor", "attendee"])
    .withMessage("Role must be admin, exhibitor or attendee"),
];

export const userStatusRules = [
  param("id").isMongoId().withMessage("Invalid user id"),
  body("isActive").isBoolean({ strict: true }).withMessage("isActive must be true or false").toBoolean(),
];
