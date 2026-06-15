import { Request, Response, NextFunction } from 'express';
import { jobService } from './job.service.js';
import sendResponse from '@/src/lib/sendResponse.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

async function getAllJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await jobService.getAllJobs(req.user.id, req.query as any);
    return sendResponse({
      res,
      status: true,
      message: 'Jobs fetched successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getSingleJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobService.getSingleJob(req.user.id, req.params.id as string);
    return sendResponse({
      res,
      status: true,
      message: 'Job fetched successfully',
      data: job,
    });
  } catch (err) {
    next(err);
  }
}

async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobService.createJob(req.projectId, req.body);
    return sendResponse({
      res,
      status: true,
      statusCode: statusCodes.CREATED,
      message: 'Job scheduled successfully',
      data: job,
    });
  } catch (err) {
    next(err);
  }
}

async function cancelJob(req: Request, res: Response, next: NextFunction) {
  try {
    await jobService.cancelJob(req.user.id, req.params.id as string);
    return sendResponse({
      res,
      status: true,
      message: 'Job cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
}

export const jobController = {
  getAllJobs,
  getSingleJob,
  createJob,
  cancelJob,
};
