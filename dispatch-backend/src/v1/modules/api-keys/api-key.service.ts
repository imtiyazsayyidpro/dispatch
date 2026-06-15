import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import crypto from 'crypto';

function generateApiKey() {
  const raw = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
  const keyPreview = raw.slice(-4);
  return { raw, keyHash, keyPreview };
}

async function getAllApiKeys(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw new AppError('Project not found', statusCodes.NOT_FOUND);

  return prisma.apiKey.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

async function createApiKey(userId: string, projectId: string, label: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw new AppError('Project not found', statusCodes.NOT_FOUND);

  const { raw, keyHash, keyPreview } = generateApiKey();

  await prisma.apiKey.create({
    data: { projectId, label, keyHash, keyPreview },
  });

  // Return raw key only once — it is never stored in plain text
  return { key: raw, label, keyPreview };
}

async function revokeApiKey(userId: string, keyId: string) {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: keyId },
    include: { project: true },
  });

  if (!apiKey || apiKey.project.userId !== userId) {
    throw new AppError('API key not found', statusCodes.NOT_FOUND);
  }

  await prisma.apiKey.delete({ where: { id: keyId } });
}

export const apiKeyService = {
  getAllApiKeys,
  createApiKey,
  revokeApiKey,
};
