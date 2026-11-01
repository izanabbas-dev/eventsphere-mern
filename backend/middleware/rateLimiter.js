import rateLimit from "express-rate-limit";

const makeLimiter = (minutes, limit, message) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message },
  });
};

export const loginLimiter = makeLimiter(15, 10, "Too many login attempts. Try again after 15 minutes.");
export const registerLimiter = makeLimiter(60, 10, "Too many accounts created. Try again after an hour.");
export const forgotPasswordLimiter = makeLimiter(60, 5, "Too many reset requests. Try again after an hour.");
