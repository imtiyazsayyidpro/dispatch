import { Request, Response, NextFunction } from 'express';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && (err as any).status === 400) {
    return res.status(statusCodes.BAD_REQUEST).json({
      status: false,
      message: 'Invalid JSON',
      data: null,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: false,
      message: err.message,
      data: err.data ?? null,
    });
  }

  console.error(err);

  return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
    status: false,
    message: 'Something went wrong',
    data: null,
  });
}

export default errorHandler;
