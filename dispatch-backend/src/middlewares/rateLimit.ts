import rateLimit from 'express-rate-limit';

const json = (message: string) => ({ status: false, message, data: null });

/** Coarse ceiling on overall API traffic per IP. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many requests, please slow down'),
});

/** Tighter limit for auth endpoints to blunt credential/code brute-forcing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many attempts. Try again in a few minutes'),
});

/** Strictest limit for endpoints that send email (verification, reset). */
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many requests. Please wait before requesting another email'),
});
