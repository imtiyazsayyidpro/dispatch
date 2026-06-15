import { Request, Response, NextFunction } from 'express';
import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import crypto from 'crypto';

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new AppError('API key is required', statusCodes.UNAUTHORIZED);
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash },
      include: { project: true },
    });

    if (!apiKey) throw new AppError('Invalid API key', statusCodes.UNAUTHORIZED);
    if (!apiKey.project) throw new AppError('Project not found', statusCodes.NOT_FOUND);

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    req.projectId = apiKey.projectId;

    next();
  } catch (err) {
    next(err);
  }
}
