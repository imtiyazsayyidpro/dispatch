import { Router } from 'express';
import { apiKeyController } from './api-key.controller.js';
import { validateBody, validateParams } from '@/src/middlewares/validate.js';
import { createApiKeySchema, apiKeyParamsSchema, projectParamsSchema } from './api-key.validation.js';

const apiKeyRouter = Router({ mergeParams: true });

apiKeyRouter.get('/', validateParams(projectParamsSchema), apiKeyController.getAllApiKeys);
apiKeyRouter.post('/', validateParams(projectParamsSchema), validateBody(createApiKeySchema), apiKeyController.createApiKey);
apiKeyRouter.delete('/:id', validateParams(apiKeyParamsSchema), apiKeyController.revokeApiKey);

export default apiKeyRouter;
