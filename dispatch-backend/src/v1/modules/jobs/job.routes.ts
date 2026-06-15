import { Router } from 'express';
import { jobController } from './job.controller.js';
import { validateBody, validateParams, validateQuery } from '@/src/middlewares/validate.js';
import { createJobSchema, jobParamsSchema, jobQuerySchema } from './job.validation.js';
import { authenticate } from '@/src/middlewares/authenticate.js';
import { authenticateApiKey } from '@/src/middlewares/authenticateApiKey.js';

const jobRouter = Router();

// API key auth — developer facing
jobRouter.post('/', authenticateApiKey, validateBody(createJobSchema), jobController.createJob);
jobRouter.delete('/:id', authenticateApiKey, validateParams(jobParamsSchema), jobController.cancelJob);

// Session auth — dashboard facing
jobRouter.get('/', authenticate, validateQuery(jobQuerySchema), jobController.getAllJobs);
jobRouter.get('/:id', authenticate, validateParams(jobParamsSchema), jobController.getSingleJob);
jobRouter.post('/:id/cancel', authenticate, validateParams(jobParamsSchema), jobController.cancelJobAsUser);

export default jobRouter;
