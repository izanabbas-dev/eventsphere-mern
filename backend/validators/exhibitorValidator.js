import { body } from "express-validator";

export const updateProfileRules = [
  body("companyName").optional().trim().notEmpty().withMessage("Company name cannot be empty"),
  body("logo").optional().isString().trim(),
  body("description").optional().isString().trim(),
  body("category").optional().isString().trim(),
  body("website").optional().isString().trim(),
  body("productsServices").optional().isArray().withMessage("Products/services must be a list"),
  body("productsServices.*").isString().trim(),
  body("contact").optional().isObject().withMessage("Contact must be an object"),
  body("contact.email").optional({ values: "falsy" }).trim().isEmail().withMessage("Contact email is not valid"),
  body("contact.person").optional().isString().trim(),
  body("contact.phone").optional().isString().trim(),
  body("contact.address").optional().isString().trim(),
];
