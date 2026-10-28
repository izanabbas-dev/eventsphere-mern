import { validationResult } from "express-validator";

// Runs after the validation rules and stops the request if any rule failed
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({ field: err.path, message: err.msg }));
    return res.status(400).json({ success: false, message: errors[0].message, errors });
  }

  next();
};

export default validate;
