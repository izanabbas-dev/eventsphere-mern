import { body, param, query } from "express-validator";

const statuses = ["draft", "published", "ongoing", "completed", "cancelled"];

export const expoIdRules = [param("id").isMongoId().withMessage("Invalid expo id")];

// ?status=a&status=b arrives as an array, so allow only one value
const isSingleValue = (value) => typeof value === "string";

export const listExpoRules = [
  query("status")
    .optional()
    .custom(isSingleValue)
    .withMessage("Status must be a single value")
    .isIn(statuses)
    .withMessage("Invalid status"),
  query("search").optional().custom(isSingleValue).withMessage("Search must be a single value"),
];

export const createExpoRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional().isString().trim(),
  body("theme").optional().isString().trim(),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").isISO8601().withMessage("End date must be a valid date"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("floorPlan.rows").optional().isInt({ min: 1, max: 50 }).withMessage("Rows must be between 1 and 50"),
  body("floorPlan.cols").optional().isInt({ min: 1, max: 50 }).withMessage("Columns must be between 1 and 50"),
];

export const updateExpoRules = [
  ...expoIdRules,
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional().isString().trim(),
  body("theme").optional().isString().trim(),
  body("startDate").optional().isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").optional().isISO8601().withMessage("End date must be a valid date"),
  body("location").optional().trim().notEmpty().withMessage("Location cannot be empty"),
  body("floorPlan.rows").optional().isInt({ min: 1, max: 50 }).withMessage("Rows must be between 1 and 50"),
  body("floorPlan.cols").optional().isInt({ min: 1, max: 50 }).withMessage("Columns must be between 1 and 50"),
];

export const updateStatusRules = [
  ...expoIdRules,
  body("status").isIn(statuses).withMessage(`Status must be one of: ${statuses.join(", ")}`),
];
