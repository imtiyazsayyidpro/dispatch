import { Request, Response, NextFunction } from 'express';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

export function requireOnboarding(req: Request, res: Response, next: NextFunction) {
  if (!req.user.isOnboarded) {
    return next(new AppError('Please complete onboarding before continuing', statusCodes.FORBIDDEN));
  }
  next();
}
