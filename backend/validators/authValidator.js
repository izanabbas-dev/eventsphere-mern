import { body } from "express-validator";

const strongPassword = (field) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number");

export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email"),
  strongPassword("password"),
  body("role")
    .optional()
    .isIn(["exhibitor", "attendee"])
    .withMessage("Role must be exhibitor or attendee"),
  body("phone").optional().trim(),
  body("companyName")
    .if(body("role").equals("exhibitor"))
    .trim()
    .notEmpty()
    .withMessage("Company name is required for exhibitors"),
  body("termsAccepted")
    .custom((value) => value === true || value === "true")
    .withMessage("You must accept the terms and conditions"),
];

export const loginRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email"),
];

export const resetPasswordRules = [
  strongPassword("password"),
];

export const updateMeRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().trim(),
  body("showContactInfo").optional().isBoolean().withMessage("Show contact info must be true or false").toBoolean(),
];

export const updatePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  strongPassword("newPassword"),
];
