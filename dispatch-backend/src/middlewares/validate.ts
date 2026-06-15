import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

function createValidator(source: 'body' | 'params' | 'query') {
  return (schema: z.ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const message = result.error.issues[0].message;
        return next(new AppError(message, statusCodes.BAD_REQUEST));
      }

      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'query') {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
        });
      } else {
        Object.assign(req[source], result.data);
      }

      next();
    };
  };
}

export const validateBody = createValidator('body');
export const validateParams = createValidator('params');
export const validateQuery = createValidator('query');
