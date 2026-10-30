import { param, query } from "express-validator";

export const expoIdParamRules = [param("expoId").isMongoId().withMessage("Invalid expo id")];

export const registrationIdRules = [param("id").isMongoId().withMessage("Invalid registration id")];

export const listRegistrationRules = [
  ...expoIdParamRules,
  query("status")
    .optional()
    .custom((value) => typeof value === "string")
    .withMessage("Status must be a single value")
    .isIn(["registered", "cancelled", "attended"])
    .withMessage("Invalid status"),
];
