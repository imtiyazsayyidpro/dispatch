/** Shapes returned by the Dispatch API (mirrors dispatch-backend's prisma models). */

export interface Project {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Present on list/detail responses; absent on create. */
  _count?: {
    apiKeys: number;
    jobs: number;
  };
}

export interface ApiKey {
  id: string;
  projectId: string;
  label: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Response of POST /projects/:id/api-keys — the raw key is returned exactly once. */
export interface CreatedApiKey {
  key: string;
  label: string;
  keyPreview: string;
}

export const JOB_STATUSES = [
  "SCHEDULED",
  "FIRING",
  "SUCCESS",
  "FAILED",
  "DEAD",
  "CANCELLED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
  id: string;
  projectId: string;
  title: string;
  webhookUrl: string;
  fireAt: string;
  status: JobStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
}

export interface JobsPage {
  jobs: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JobLog {
  id: string;
  jobId: string;
  attempt: number;
  /** "SUCCESS" | "FAILED" per delivery attempt. */
  status: string;
  /** Null when the request never completed (network error, timeout). */
  responseCode: number | null;
  responseBody: string | null;
  firedAt: string;
}

/** Response of GET /jobs/:id — the list shape plus payload and delivery logs. */
export interface JobDetail extends Job {
  payload: unknown;
  logs: JobLog[];
}
