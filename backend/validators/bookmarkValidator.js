import { body, param } from "express-validator";

export const sessionIdRules = [param("id").isMongoId().withMessage("Invalid session id")];

// Max 1440 minutes (1 day), the reminder job only looks one day ahead
export const addBookmarkRules = [
  ...sessionIdRules,
  body("remindBeforeMinutes")
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage("Remind before minutes must be between 1 and 1440")
    .toInt(),
];
