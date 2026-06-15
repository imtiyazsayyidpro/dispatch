import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import paginate from '@/src/lib/paginate.js';
import { scheduleJob, cancelScheduledJob } from '@/src/scheduler/scheduler.js';
import { assertPublicWebhookUrl } from '@/src/lib/safeUrl.js';

async function getAllJobs(
  userId: string,
  filters: {
    status?: 'SCHEDULED' | 'FIRING' | 'SUCCESS' | 'FAILED' | 'DEAD' | 'CANCELLED';
    projectId?: string;
    page: number;
    limit: number;
  }
) {
  const { status, projectId, page, limit } = filters;

  const userProjects = await prisma.project.findMany({
    where: { userId },
    select: { id: true },
  });

  const projectIds = userProjects.map((p) => p.id);

  const where = {
    projectId: projectId
      ? (projectIds.includes(projectId) ? projectId : undefined)
      : { in: projectIds },
    ...(status && { status }),
  };

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, pagination: paginate(total, page, limit) };
}

async function getSingleJob(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId },
    include: {
      project: { select: { id: true, name: true, userId: true } },
      logs: { orderBy: { firedAt: 'desc' } },
    },
  });

  if (!job || job.project.userId !== userId) {
    throw new AppError('Job not found', statusCodes.NOT_FOUND);
  }

  return job;
}

async function createJob(
  projectId: string,
  data: {
    title: string;
    webhookUrl: string;
    fireAt: string;
    payload?: Record<string, any>;
  }
) {
  const fireAt = new Date(data.fireAt);

  if (fireAt <= new Date()) {
    throw new AppError('fireAt must be a future datetime', statusCodes.BAD_REQUEST);
  }

  await assertPublicWebhookUrl(data.webhookUrl);

  const job = await prisma.job.create({
    data: {
      projectId,
      title: data.title,
      webhookUrl: data.webhookUrl,
      fireAt,
      payload: data.payload ?? {},
      status: 'SCHEDULED',
    },
  });

  scheduleJob(job);

  return job;
}

async function cancelJob(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId },
    include: { project: true },
  });

  if (!job || job.project.userId !== userId) {
    throw new AppError('Job not found', statusCodes.NOT_FOUND);
  }

  if (job.status !== 'SCHEDULED') {
    throw new AppError('Only scheduled jobs can be cancelled', statusCodes.BAD_REQUEST);
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'CANCELLED' },
  });

  cancelScheduledJob(jobId);
}

export const jobService = {
  getAllJobs,
  getSingleJob,
  createJob,
  cancelJob,
};
