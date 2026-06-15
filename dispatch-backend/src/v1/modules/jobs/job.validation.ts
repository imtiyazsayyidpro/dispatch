import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  webhookUrl: z.string().url('Invalid webhook URL'),
  fireAt: z.string().datetime('Invalid datetime format, use ISO 8601'),
  payload: z.record(z.string(), z.any()).optional(),
});

export const jobParamsSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
});

export const jobQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'FIRING', 'SUCCESS', 'FAILED', 'DEAD', 'CANCELLED']).optional(),
  projectId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
