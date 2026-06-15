import express from 'express';
import cors from 'cors';
import v1Router from '@/src/v1/v1.router.js';
import errorHandler from '@/src/middlewares/errorHandler.js';
import { apiLimiter } from '@/src/middlewares/rateLimit.js';
import type { CorsOptions } from 'cors';

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Non-browser callers (the public API key clients, curl) send no Origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Dev convenience: any localhost port is fine outside production.
    if (
      process.env.NODE_ENV !== 'production' &&
      /^http:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    // Disallowed: omit CORS headers (the browser blocks it) without erroring.
    return callback(null, false);
  },
};

const app = express();

// Behind a reverse proxy (most deployments), trust the first hop so req.ip and
// rate limiting key off the real client address. Opt-in to avoid IP spoofing
// via X-Forwarded-For when there is no proxy in front.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/v1', apiLimiter, v1Router);

app.use(errorHandler);

export default app;
