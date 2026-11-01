import { body, param, query } from "express-validator";

const isSingleValue = (value) => typeof value === "string";

export const listExhibitorRules = [
  param("expoId").isMongoId().withMessage("Invalid expo id"),
  query("search").optional().custom(isSingleValue).withMessage("Search must be a single value"),
  query("category").optional().custom(isSingleValue).withMessage("Category must be a single value"),
];

export const exhibitorProfileRules = [
  param("id").isMongoId().withMessage("Invalid exhibitor id"),
  query("expoId")
    .optional()
    .custom(isSingleValue)
    .withMessage("Expo id must be a single value")
    .isMongoId()
    .withMessage("Invalid expo id"),
];

export const deleteDocumentRules = [param("docId").isMongoId().withMessage("Invalid document id")];

export const downloadDocumentRules = [
  param("id").isMongoId().withMessage("Invalid exhibitor id"),
  ...deleteDocumentRules,
];

export const updateProfileRules = [
  body("companyName").optional().trim().notEmpty().withMessage("Company name cannot be empty"),
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
