import { z } from 'zod';

export const createApiKeySchema = z.object({
  label: z.string().min(1, 'Label is required'),
});

export const apiKeyParamsSchema = z.object({
  id: z.string().min(1, 'API Key ID is required'),
});

export const projectParamsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});
