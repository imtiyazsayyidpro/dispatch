import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service.js';
import sendResponse from '@/src/lib/sendResponse.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

async function getAllProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await projectService.getAllProjects(req.user.id);
    return sendResponse({
      res,
      status: true,
      message: 'Projects fetched successfully',
      data: projects,
    });
  } catch (err) {
    next(err);
  }
}

async function getSingleProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.getSingleProject(req.user.id, req.params.id as string);
    return sendResponse({
      res,
      status: true,
      message: 'Project fetched successfully',
      data: project,
    });
  } catch (err) {
    next(err);
  }
}

async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.createProject(req.user.id, req.body.name);
    return sendResponse({
      res,
      status: true,
      statusCode: statusCodes.CREATED,
      message: 'Project created successfully',
      data: project,
    });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.updateProject(req.user.id, req.params.id as string, req.body.name);
    return sendResponse({
      res,
      status: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(req.user.id, req.params.id as string);
    return sendResponse({
      res,
      status: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export const projectController = {
  getAllProjects,
  getSingleProject,
  createProject,
  updateProject,
  deleteProject,
};
