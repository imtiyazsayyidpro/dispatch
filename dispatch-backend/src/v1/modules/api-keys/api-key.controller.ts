import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from './api-key.service.js';
import sendResponse from '@/src/lib/sendResponse.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

async function getAllApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const keys = await apiKeyService.getAllApiKeys(req.user.id, req.params.projectId as string);
    return sendResponse({
      res,
      status: true,
      message: 'API keys fetched successfully',
      data: keys,
    });
  } catch (err) {
    next(err);
  }
}

async function createApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const key = await apiKeyService.createApiKey(req.user.id, req.params.projectId as string, req.body.label);
    return sendResponse({
      res,
      status: true,
      statusCode: statusCodes.CREATED,
      message: 'API key created successfully. Copy it now — it will not be shown again.',
      data: key,
    });
  } catch (err) {
    next(err);
  }
}

async function revokeApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    await apiKeyService.revokeApiKey(req.user.id, req.params.id as string);
    return sendResponse({
      res,
      status: true,
      message: 'API key revoked successfully',
    });
  } catch (err) {
    next(err);
  }
}

export const apiKeyController = {
  getAllApiKeys,
  createApiKey,
  revokeApiKey,
};
