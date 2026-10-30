import { param } from "express-validator";

export const expoReportRules = [param("expoId").isMongoId().withMessage("Invalid expo id")];
