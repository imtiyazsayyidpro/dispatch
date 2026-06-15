import AppError from '@/src/lib/AppError.js';
import prisma from '@/src/lib/prisma.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isOnboarded: boolean;
}

export async function getAuthUserById(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
  });

  if (!user) throw new AppError('User not found', statusCodes.NOT_FOUND);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    isOnboarded: user.isOnboarded,
  };
}
