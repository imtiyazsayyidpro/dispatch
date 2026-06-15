import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export const projectParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});
