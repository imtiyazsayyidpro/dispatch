import { Request, Response, NextFunction } from 'express';
import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import { getAuthUserById } from '@/src/lib/authContext.js';

function getTokenFromHeader(authorization?: string | string[]) {
  if (!authorization || Array.isArray(authorization)) return null;
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : authorization;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromHeader(req.headers['authorization']);
    if (!token) throw new AppError('Unauthorized', statusCodes.UNAUTHORIZED);

    const session = await prisma.session.findFirst({
      where: { token, isActive: true, expiresAt: { gt: new Date() } },
    });

    if (!session) throw new AppError('Unauthorized', statusCodes.UNAUTHORIZED);

    const user = await getAuthUserById(session.userId);
    if (!user.isActive) throw new AppError('Account is deactivated', statusCodes.UNAUTHORIZED);

    req.user = user;
    req.session = session;

    next();
  } catch (err) {
    next(err);
  }
}
