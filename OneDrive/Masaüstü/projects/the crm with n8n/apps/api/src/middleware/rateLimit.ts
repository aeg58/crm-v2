import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000), // 1 dk
  max: Number(process.env.RATE_LIMIT_MAX || 1000),              // devde yüksek
  standardHeaders: true,
  legacyHeaders: false,
  // Dev ortamında veya bayrak açıkken limiti atla
  skip: () => isDev || process.env.RATE_LIMIT_DISABLED === "true",
});
