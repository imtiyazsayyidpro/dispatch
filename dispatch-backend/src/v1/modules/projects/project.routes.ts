import { Router } from 'express';
import { projectController } from './project.controller.js';
import { validateBody, validateParams } from '@/src/middlewares/validate.js';
import { createProjectSchema, updateProjectSchema, projectParamsSchema } from './project.validation.js';

const projectRouter = Router();

projectRouter.get('/', projectController.getAllProjects);
projectRouter.get('/:id', validateParams(projectParamsSchema), projectController.getSingleProject);
projectRouter.post('/', validateBody(createProjectSchema), projectController.createProject);
projectRouter.put('/:id', validateParams(projectParamsSchema), validateBody(updateProjectSchema), projectController.updateProject);
projectRouter.delete('/:id', validateParams(projectParamsSchema), projectController.deleteProject);

export default projectRouter;
