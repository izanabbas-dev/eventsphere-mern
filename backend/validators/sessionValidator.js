import { body, param, query } from "express-validator";
import { isSingleValue } from "../utils/helpers.js";

const types = ["session", "workshop", "keynote", "panel"];

const expoIdParamRules = [param("expoId").isMongoId().withMessage("Invalid expo id")];

export const sessionIdRules = [param("id").isMongoId().withMessage("Invalid session id")];

export const listSessionRules = [
  ...expoIdParamRules,
  query("date")
    .optional()
    .custom(isSingleValue)
    .withMessage("Date must be a single value")
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("Date must be in YYYY-MM-DD format"),
  query("type")
    .optional()
    .custom(isSingleValue)
    .withMessage("Type must be a single value")
    .isIn(types)
    .withMessage("Invalid type"),
  query("topic").optional().custom(isSingleValue).withMessage("Topic must be a single value"),
  query("search").optional().custom(isSingleValue).withMessage("Search must be a single value"),
];

const speakerRules = [
  body("speakers").optional().isArray().withMessage("Speakers must be a list"),
  body("speakers.*").isObject().withMessage("Each speaker must be an object"),
  body("speakers.*.name").trim().notEmpty().withMessage("Speaker name is required"),
  body("speakers.*.designation").optional().isString().trim(),
  body("speakers.*.bio").optional().isString().trim(),
];

export const createSessionRules = [
  ...expoIdParamRules,
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional().isString().trim(),
  body("topic").optional().isString().trim(),
  body("type").optional().isIn(types).withMessage(`Type must be one of: ${types.join(", ")}`),
  ...speakerRules,
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("startTime").isISO8601().withMessage("Start time must be a valid date and time"),
  body("endTime").isISO8601().withMessage("End time must be a valid date and time"),
  body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be at least 1").toInt(),
];

export const updateSessionRules = [
  ...sessionIdRules,
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional().isString().trim(),
  body("topic").optional().isString().trim(),
  body("type").optional().isIn(types).withMessage(`Type must be one of: ${types.join(", ")}`),
  ...speakerRules,
  body("location").optional().trim().notEmpty().withMessage("Location cannot be empty"),
  body("startTime").optional().isISO8601().withMessage("Start time must be a valid date and time"),
  body("endTime").optional().isISO8601().withMessage("End time must be a valid date and time"),
  body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be at least 1").toInt(),
];
