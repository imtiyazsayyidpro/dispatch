import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

async function getAllProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { apiKeys: true, jobs: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
}

async function getSingleProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { _count: { select: { apiKeys: true, jobs: true } } },
  });

  if (!project) throw new AppError('Project not found', statusCodes.NOT_FOUND);

  return project;
}

async function createProject(userId: string, name: string) {
  const project = await prisma.project.create({
    data: { userId, name },
  });

  return project;
}

async function updateProject(userId: string, projectId: string, name: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw new AppError('Project not found', statusCodes.NOT_FOUND);

  return prisma.project.update({
    where: { id: projectId },
    data: { name },
  });
}

async function deleteProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw new AppError('Project not found', statusCodes.NOT_FOUND);

  await prisma.project.delete({ where: { id: projectId } });
}

export const projectService = {
  getAllProjects,
  getSingleProject,
  createProject,
  updateProject,
  deleteProject,
};
