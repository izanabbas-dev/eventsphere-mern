import { body, param, query } from "express-validator";
import { isSingleValue } from "../utils/helpers.js";

const sizes = ["small", "medium", "large"];
const statuses = ["available", "reserved", "booked"];

export const expoIdParamRules = [param("expoId").isMongoId().withMessage("Invalid expo id")];

export const boothIdRules = [param("id").isMongoId().withMessage("Invalid booth id")];

export const listBoothRules = [
  ...expoIdParamRules,
  query("status")
    .optional()
    .custom(isSingleValue)
    .withMessage("Status must be a single value")
    .isIn(statuses)
    .withMessage("Invalid status"),
];

export const createBoothRules = [
  ...expoIdParamRules,
  body("boothNumber").trim().notEmpty().withMessage("Booth number is required"),
  body("hall").optional().isString().trim(),
  body("position.row").isInt({ min: 0 }).withMessage("Row must be a number of 0 or more").toInt(),
  body("position.col").isInt({ min: 0 }).withMessage("Column must be a number of 0 or more").toInt(),
  body("size").optional().isIn(sizes).withMessage(`Size must be one of: ${sizes.join(", ")}`),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be 0 or more").toFloat(),
];

export const updateBoothRules = [
  ...boothIdRules,
  body("boothNumber").optional().trim().notEmpty().withMessage("Booth number cannot be empty"),
  body("hall").optional().isString().trim(),
  body("position.row").optional().isInt({ min: 0 }).withMessage("Row must be a number of 0 or more").toInt(),
  body("position.col").optional().isInt({ min: 0 }).withMessage("Column must be a number of 0 or more").toInt(),
  body("size").optional().isIn(sizes).withMessage(`Size must be one of: ${sizes.join(", ")}`),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be 0 or more").toFloat(),
];

export const assignBoothRules = [
  ...boothIdRules,
  body("exhibitorId").isMongoId().withMessage("Valid exhibitor id is required"),
];

export const boothVisitRules = [
  ...boothIdRules,
  body("source")
    .optional()
    .isIn(["floor_plan", "check_in"])
    .withMessage("Source must be floor_plan or check_in"),
];

export const boothDetailsRules = [
  ...boothIdRules,
  body("productsShowcased").optional().isArray().withMessage("Products must be a list"),
  body("productsShowcased.*").isString().trim(),
  body("staff").optional().isArray().withMessage("Staff must be a list"),
  body("staff.*").isObject().withMessage("Each staff member must be an object"),
  body("staff.*.name").trim().notEmpty().withMessage("Staff name is required"),
  body("staff.*.role").optional().isString().trim(),
  body("staff.*.phone").optional().isString().trim(),
];
