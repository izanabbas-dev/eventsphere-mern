import { param, query } from "express-validator";

const isSingleValue = (value) => typeof value === "string";

export const expoIdParamRules = [param("expoId").isMongoId().withMessage("Invalid expo id")];

export const registrationIdRules = [param("id").isMongoId().withMessage("Invalid registration id")];

export const listRegistrationRules = [
  ...expoIdParamRules,
  query("status")
    .optional()
    .custom(isSingleValue)
    .withMessage("Status must be a single value")
    .isIn(["registered", "cancelled", "attended"])
    .withMessage("Invalid status"),
];
