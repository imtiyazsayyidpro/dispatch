import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import bcrypt from 'bcrypt';

async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    omit: { passwordHash: true },
    include: { onboarding: true },
  });

  if (!user) throw new AppError('User not found', statusCodes.NOT_FOUND);

  return user;
}

async function updateProfile(userId: string, data: { name: string; email: string }) {
  const emailTaken = await prisma.user.findFirst({
    where: { email: data.email, id: { not: userId } },
  });

  if (emailTaken) throw new AppError('Email is already in use', statusCodes.CONFLICT);

  return prisma.user.update({
    where: { id: userId },
    omit: { passwordHash: true },
    data: { name: data.name, email: data.email },
  });
}

async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) throw new AppError('User not found', statusCodes.NOT_FOUND);

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError('Current password is incorrect', statusCodes.UNAUTHORIZED);

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate all existing sessions except current
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
}

async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) throw new AppError('User not found', statusCodes.NOT_FOUND);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError('Incorrect password', statusCodes.UNAUTHORIZED);

  // Delete in order to respect FK constraints
  await prisma.$transaction([
    prisma.jobLog.deleteMany({
      where: { job: { project: { userId } } },
    }),
    prisma.job.deleteMany({
      where: { project: { userId } },
    }),
    prisma.apiKey.deleteMany({
      where: { project: { userId } },
    }),
    prisma.project.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.userOnboarding.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

export const meService = {
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};
