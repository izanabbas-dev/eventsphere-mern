import { param } from "express-validator";

export const notificationIdRules = [param("id").isMongoId().withMessage("Invalid notification id")];
