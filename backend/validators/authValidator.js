import { body } from "express-validator";

export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
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
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const updateMeRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().trim(),
  body("avatar").optional().isString().trim().withMessage("Avatar must be a text URL"),
];

export const updatePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];
