import prisma from '@/src/lib/prisma.js';
import { Job } from '../../generated/prisma/client.js';
import { assertPublicWebhookUrl } from '@/src/lib/safeUrl.js';

/** How often the backstop sweep runs to catch anything the timers missed. */
const SWEEP_INTERVAL_MS = 15_000;
/** Only hold an in-memory timer for jobs due within this window (avoids the
 *  setTimeout 32-bit overflow and keeps memory bounded). Anything further out
 *  is picked up by the sweep once it enters the window. */
const TIMER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
/** A job left FIRING longer than this is assumed crashed mid-flight and is
 *  reset to SCHEDULED so it gets retried. Must exceed FETCH_TIMEOUT_MS. */
const FIRING_LEASE_MS = 2 * 60 * 1000; // 2 minutes
/** Hard ceiling on a single webhook call so firing can't hang indefinitely. */
const FETCH_TIMEOUT_MS = 30_000;

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [30_000, 60_000, 300_000]; // 30s, 1m, 5m

const timers = new Map<string, NodeJS.Timeout>();

/** Arms a precise in-memory timer for a near-term job. Idempotent. */
function ensureTimer(jobId: string, fireAt: Date) {
  if (timers.has(jobId)) return;

  const delay = fireAt.getTime() - Date.now();
  if (delay > TIMER_WINDOW_MS) return; // too far out — the sweep will arm it later

  const timeout = setTimeout(() => {
    timers.delete(jobId);
    void claimAndFire(jobId);
  }, Math.max(delay, 0));

  timers.set(jobId, timeout);
}

/** Called when a job is created. */
export function scheduleJob(job: Job) {
  ensureTimer(job.id, job.fireAt);
}

/** Called when a job is cancelled. The atomic claim already prevents a fire
 *  on a non-SCHEDULED job, so this is just timer cleanup. */
export function cancelScheduledJob(jobId: string) {
  const timeout = timers.get(jobId);
  if (timeout) {
    clearTimeout(timeout);
    timers.delete(jobId);
  }
}

/**
 * Atomically claims a job (SCHEDULED -> FIRING) and fires it. The conditional
 * update is the single source of truth: if it doesn't flip exactly one row the
 * job was already claimed, cancelled, or fired elsewhere, so we bail. Safe to
 * call from overlapping timers/sweeps and across replicas.
 */
async function claimAndFire(jobId: string) {
  const claim = await prisma.job.updateMany({
    where: { id: jobId, status: 'SCHEDULED' },
    data: { status: 'FIRING' },
  });
  if (claim.count !== 1) return;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  const attempt = (await prisma.jobLog.count({ where: { jobId } })) + 1;

  // Re-validate at fire time: the host may now resolve to a private address
  // (DNS rebinding), or the job may predate the SSRF guard. Don't retry — it
  // will never become safe — so log it and mark the job dead.
  try {
    await assertPublicWebhookUrl(job.webhookUrl);
  } catch (err: any) {
    await prisma.jobLog.create({
      data: {
        jobId,
        attempt,
        status: 'FAILED',
        responseCode: null,
        responseBody: err?.message ?? 'Webhook URL blocked',
        firedAt: new Date(),
      },
    });
    await prisma.job.update({ where: { id: jobId }, data: { status: 'DEAD' } });
    return;
  }

  try {
    const response = await fetch(job.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.id,
        title: job.title,
        payload: job.payload,
        firedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const responseBody = await response.text();

    await prisma.jobLog.create({
      data: {
        jobId,
        attempt,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        responseCode: response.status,
        responseBody,
        firedAt: new Date(),
      },
    });

    if (response.ok) {
      await prisma.job.update({ where: { id: jobId }, data: { status: 'SUCCESS' } });
    } else {
      await scheduleRetry(job, attempt);
    }
  } catch (err: any) {
    await prisma.jobLog.create({
      data: {
        jobId,
        attempt,
        status: 'FAILED',
        responseCode: null,
        responseBody: err?.message ?? 'Unknown error',
        firedAt: new Date(),
      },
    });

    await scheduleRetry(job, attempt);
  }
}

/**
 * Records a retry by pushing fireAt forward to the backoff time and returning
 * the job to SCHEDULED. Because the delay lives in fireAt (not a setTimeout),
 * retries survive a restart — the sweep re-arms them.
 */
async function scheduleRetry(job: Job, attempt: number) {
  if (attempt >= MAX_RETRIES) {
    await prisma.job.update({ where: { id: job.id }, data: { status: 'DEAD' } });
    return;
  }

  const delay = RETRY_DELAYS_MS[attempt - 1] ?? 30_000;
  const nextFireAt = new Date(Date.now() + delay);

  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'SCHEDULED', fireAt: nextFireAt, retryCount: { increment: 1 } },
  });

  ensureTimer(job.id, nextFireAt);
}

/**
 * The self-healing backstop. Every interval it:
 *   1. reclaims jobs stuck FIRING past their lease (crashed mid-fire),
 *   2. fires anything already due, and
 *   3. arms timers for jobs about to enter the precision window.
 * This makes the scheduler crash-safe and downtime-safe without the in-memory
 * timers being authoritative.
 */
async function sweep() {
  try {
    const now = new Date();

    // 1. Recover crashed in-flight jobs.
    await prisma.job.updateMany({
      where: {
        status: 'FIRING',
        updatedAt: { lt: new Date(now.getTime() - FIRING_LEASE_MS) },
      },
      data: { status: 'SCHEDULED' },
    });

    // 2. Fire everything that's due (including freshly recovered ones).
    const due = await prisma.job.findMany({
      where: { status: 'SCHEDULED', fireAt: { lte: now } },
      select: { id: true },
      take: 500,
    });
    for (const { id } of due) await claimAndFire(id);

    // 3. Arm precise timers for jobs entering the window.
    const upcoming = await prisma.job.findMany({
      where: {
        status: 'SCHEDULED',
        fireAt: { gt: now, lte: new Date(now.getTime() + TIMER_WINDOW_MS) },
      },
      select: { id: true, fireAt: true },
    });
    for (const job of upcoming) ensureTimer(job.id, job.fireAt);
  } catch (err) {
    console.error('Scheduler sweep failed:', err);
  }
}

/** Boots the scheduler: an immediate catch-up sweep, then a periodic backstop. */
export async function startScheduler() {
  await sweep();
  setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
  console.log('Scheduler started (sweep every %ds)', SWEEP_INTERVAL_MS / 1000);
}
