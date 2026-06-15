import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import meRouter from './modules/me/me.routes.js';
import projectRouter from './modules/projects/project.routes.js';
import apiKeyRouter from './modules/api-keys/api-key.routes.js';
import jobRouter from './modules/jobs/job.routes.js';
import { authenticate } from '@/src/middlewares/authenticate.js';
import { requireOnboarding } from '@/src/middlewares/requireOnboarding.js';

const v1Router = Router();

v1Router.use('/auth', authRouter);

// Jobs authenticate per-route — API key for POST/DELETE (developer-facing),
// session for GET (dashboard). They must be mounted BEFORE the global session
// gate below, or the global `authenticate` shadows the API-key endpoints and
// external callers get "Unauthorized".
v1Router.use('/jobs', jobRouter);

v1Router.use(authenticate);
v1Router.use('/me', meRouter);

v1Router.use(requireOnboarding);
v1Router.use('/projects', projectRouter);
v1Router.use('/projects/:projectId/api-keys', apiKeyRouter);

export default v1Router;
