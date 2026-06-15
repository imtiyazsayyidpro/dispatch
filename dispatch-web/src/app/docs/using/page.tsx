import type { Metadata } from "next";
import Link from "next/link";

import { JobStatusBadge } from "@/components/app/job-status-badge";
import { Panel } from "@/components/app/panel";
import { AgentPrompt } from "@/components/docs/agent-prompt";
import { CodeBlock, CodeTabs } from "@/components/docs/code-block";
import type { DocSectionLink } from "@/components/docs/docs-nav";
import { DocsShell } from "@/components/docs/docs-shell";
import { Endpoint } from "@/components/docs/endpoint";
import { LifecycleDiagram } from "@/components/docs/lifecycle-diagram";
import {
  Callout,
  DocSection,
  Field,
  FieldList,
  K,
  P,
} from "@/components/docs/primitives";

export const metadata: Metadata = {
  title: "Using Dispatch — Docs",
  description:
    "Integrate scheduled webhooks into your app: API keys, the jobs API, the delivery contract, retries, and copy-pasteable examples.",
};

const SECTIONS: DocSectionLink[] = [
  { id: "introduction", label: "Introduction", short: "intro" },
  { id: "quickstart", label: "Quickstart", short: "quickstart" },
  { id: "authentication", label: "Authentication", short: "auth" },
  { id: "scheduling-a-job", label: "Scheduling a job", short: "schedule" },
  { id: "cancelling-a-job", label: "Cancelling a job", short: "cancel" },
  { id: "webhook-delivery", label: "Webhook delivery", short: "delivery" },
  { id: "job-lifecycle", label: "Job lifecycle", short: "lifecycle" },
  { id: "code-examples", label: "Code examples", short: "examples" },
  { id: "api-reference", label: "API reference", short: "api" },
];

function sectionIndex(id: string) {
  return String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/* AI setup                                                            */
/* ------------------------------------------------------------------ */

const INTEGRATION_PROMPT = `You are integrating Dispatch — a webhook scheduler — into this codebase.

Dispatch in one sentence: you POST it a job (a URL, a UTC time, an optional JSON payload) and at exactly that time it POSTs the payload back to the URL, with retries and delivery logs.

Dispatch is a hosted service — there is nothing to deploy. The API lives at:
  https://dispatch-api.imtiyazsayyid.in

Credentials for this integration:
- API key: {{DISPATCH_API_KEY}} — send it as the x-api-key header. Treat it as a secret: wire it through this project's existing env/secrets mechanism, never hardcode it, never commit it.

## Before writing any code
1. Explore the codebase: language, framework, HTTP client conventions, env/config handling, how outbound API clients are structured, and where inbound webhook/route handlers live.
2. Find the actual use case: look for TODOs, cron jobs, setTimeout/sleep-based delays, or queue code that schedules future work. If it is not obvious what should be scheduled, ask one question: "What event should trigger a scheduled webhook, and what should happen when it fires?" Then proceed.
3. Match existing patterns exactly — naming, error handling, logging, test layout. The integration should look like it was written by this repo's authors.

## API contract (authoritative — do not invent endpoints beyond this)
Schedule a job:
  POST https://dispatch-api.imtiyazsayyid.in/api/v1/jobs
  Headers: Content-Type: application/json, x-api-key: <key>
  Body:
    title       string, required — human-readable, shown in the dashboard
    webhookUrl  string, required — must be publicly reachable from Dispatch
    fireAt      string, required — ISO 8601 UTC with a trailing Z (e.g. 2026-06-13T09:30:00Z); must be in the future; timezone offsets like +05:30 are rejected with a 400
    payload     object, optional — delivered back verbatim; defaults to {}
  Response 201: { "status": true, "message": string, "data": <job> }
    data.id is the job's UUID — persist it alongside the domain record that caused the scheduling, so the job can be cancelled later.
  Errors: { "status": false, "message": string } with HTTP 400 (validation) or 401 (bad key). Surface "message" in thrown errors.

Cancel a job:
  DELETE https://dispatch-api.imtiyazsayyid.in/api/v1/jobs/:id  (same x-api-key header)
  Only jobs still in SCHEDULED state can be cancelled — 400 otherwise, 404 if the id is unknown or belongs to a different project's key.

Delivery (what the webhook handler receives):
  POST to webhookUrl, Content-Type: application/json, body:
    { "jobId": string, "title": string, "payload": object, "firedAt": string }

## Rules the integration must respect
- The handler must respond 2xx fast, then do the real work asynchronously. Any non-2xx or network failure triggers retries (30s, then 1m), and the job is marked DEAD after 3 failed attempts.
- Retries mean at-least-once delivery: make the handler idempotent, keyed on jobId.
- Dispatch does not sign deliveries yet. Generate a long random token, store it in env, append it to webhookUrl as a query parameter when scheduling, and verify it in the handler with a constant-time comparison. Reject deliveries without it.
- fireAt is millisecond-precise; send the exact instant intended, not a rounded minute.
- Build a small Dispatch client module (schedule + cancel) with explicit error handling, configured from env, following this repo's conventions — do not scatter raw fetch calls through the codebase.

## Deliverables
1. The Dispatch client module (schedule + cancel).
2. A webhook handler route: token verification, fast 2xx acknowledgement, idempotent processing.
3. Env entries (API key, webhook token) added to the project's env template — with placeholder values, not the real ones. The base URL can be a constant.
4. Wiring into the actual use case identified above.
5. Tests if the repo has a test suite; otherwise a short note describing manual verification (schedule a job 2 minutes out, watch it hit the handler and flip to SUCCESS in the Dispatch dashboard).

Work incrementally: after each piece, make sure the project still compiles and lints clean before moving to the next.`;

/* ------------------------------------------------------------------ */
/* 01 · Introduction                                                   */
/* ------------------------------------------------------------------ */

function Introduction() {
  return (
    <DocSection
      index={sectionIndex("introduction")}
      id="introduction"
      eyebrow="introduction"
      title="What Dispatch is"
      lead={
        <>
          Dispatch is a webhook scheduler: you give it a URL, a UTC
          timestamp, and an optional JSON payload, and it sends a{" "}
          <K>POST</K> to that URL at that moment. It replaces the cron box,
          the delay queue, and the retry loop you would otherwise build to
          make one HTTP request in the future.
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* 02 · Quickstart                                                     */
/* ------------------------------------------------------------------ */

const QUICKSTART_CURL = `# fireAt must be in the future — set it a couple of minutes out
curl -X POST https://dispatch-api.imtiyazsayyid.in/api/v1/jobs \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_your_key_here" \\
  -d '{
    "title": "Hello from Dispatch",
    "webhookUrl": "https://your-app.com/hooks/hello",
    "fireAt": "2026-06-12T12:00:00Z",
    "payload": { "greeting": "right on time" }
  }'`;

const QUICKSTART_RESPONSE = `{
  "status": true,
  "message": "Job scheduled successfully",
  "data": {
    "id": "3f6c2b8e-7a41-4c9d-9b21-d5a0c3e8f612",
    "status": "SCHEDULED",
    "fireAt": "2026-06-12T12:00:00.000Z"
  }
}`;

const QUICKSTART_STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Create an account",
    body: (
      <>
        <Link
          href="/register"
          className="text-amber-400 underline-offset-4 hover:underline"
        >
          Register
        </Link>{" "}
        for Dispatch. Email, password, done — there is nothing to deploy
        or host.
      </>
    ),
  },
  {
    title: "Create a project",
    body: (
      <>
        In the dashboard, open <K>projects</K> and create one. Call it
        whatever the environment is — &quot;production&quot; is a fine
        first name.
      </>
    ),
  },
  {
    title: "Generate an API key",
    body: (
      <>
        On the project page, generate a key and copy it when it is shown —
        that is the only time you will see it.
      </>
    ),
  },
  {
    title: "Schedule your first job",
    body: (
      <>
        Point <K>webhookUrl</K> at any endpoint you control (or a request
        bin), set <K>fireAt</K> a couple of minutes out, and send it:
      </>
    ),
  },
  {
    title: "See it fire",
    body: (
      <>
        Open <K>jobs</K> in the dashboard. At <K>fireAt</K> the status lamp
        flips <K>SCHEDULED → FIRING → SUCCESS</K>, and the delivery log
        records the attempt — status code, response body, timing.
      </>
    ),
  },
];

function Quickstart() {
  return (
    <DocSection
      index={sectionIndex("quickstart")}
      id="quickstart"
      eyebrow="quickstart"
      title="Zero to a fired webhook"
      lead="Five steps, about five minutes, three of which you only ever do once."
    >
      <ol className="max-w-3xl">
        {QUICKSTART_STEPS.map((step, i) => (
          <li key={step.title} className="relative flex gap-5">
            <div className="flex flex-col items-center">
              <div className="grid size-9 shrink-0 place-items-center border border-zinc-800 bg-zinc-900/60 font-mono text-[11px] text-amber-400">
                {String(i + 1).padStart(2, "0")}
              </div>
              {i < QUICKSTART_STEPS.length - 1 ? (
                <div className="w-px flex-1 bg-zinc-800" aria-hidden="true" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-8">
              <h3 className="pt-1.5 text-base font-medium text-zinc-100">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-400">
                {step.body}
              </p>
              {i === 3 ? (
                <div className="mt-4 space-y-3">
                  <CodeBlock code={QUICKSTART_CURL} lang="bash" />
                  <CodeBlock
                    code={QUICKSTART_RESPONSE}
                    lang="json"
                    title="201 · response (abridged)"
                  />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 03 · Authentication                                                 */
/* ------------------------------------------------------------------ */

const API_KEY_HEADER = `# every scheduling call carries a project's API key
curl https://dispatch-api.imtiyazsayyid.in/api/v1/jobs \\
  -H "x-api-key: sk_4f8a2c9b51de836b91c0a7e2d4f6a8b0" \\
  ...`;

function Authentication() {
  return (
    <DocSection
      index={sectionIndex("authentication")}
      id="authentication"
      eyebrow="authentication"
      title="API keys"
      lead="Your code authenticates with a project-scoped API key. A key can only touch its own project's jobs — one for staging, one for production, revoke either without touching the other."
    >
      <div className="max-w-3xl space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          getting a key
        </p>
        <P>
          Keys are generated in the dashboard: open your project, then{" "}
          <K>api keys → new key</K>. Label it for where it will live —
          &quot;production server&quot;, &quot;CI&quot; — and copy it
          immediately. It is shown exactly once.
        </P>
      </div>

      <CodeBlock
        code={API_KEY_HEADER}
        lang="bash"
        title="passing the key"
        className="max-w-3xl"
      />

      <Callout tone="warn" legend="key security" className="max-w-3xl">
        <ul className="space-y-1.5">
          <li>
            Keys look like <K>sk_</K> followed by 64 hex characters and are
            stored as a SHA-256 hash — Dispatch cannot show a key again
            after creation.
          </li>
          <li>
            The dashboard shows only a label, the last four characters, and
            when the key was last used.
          </li>
          <li>
            Revoke a key at any time from the project page; revocation is
            immediate.
          </li>
          <li>
            Treat keys like passwords: environment variables, never client
            code, never the repo.
          </li>
        </ul>
      </Callout>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 04 · Scheduling a job                                               */
/* ------------------------------------------------------------------ */

const CREATE_JOB_REQ = `curl -X POST https://dispatch-api.imtiyazsayyid.in/api/v1/jobs \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_4f8a2c9b51de836b91c0a7e2d4f6a8b0" \\
  -d '{
    "title": "Trial expiry reminder",
    "webhookUrl": "https://your-app.com/hooks/trial-expiry",
    "fireAt": "2026-06-13T09:30:00Z",
    "payload": { "userId": "usr_812", "plan": "pro" }
  }'`;

const CREATE_JOB_RES = `{
  "status": true,
  "message": "Job scheduled successfully",
  "data": {
    "id": "3f6c2b8e-7a41-4c9d-9b21-d5a0c3e8f612",
    "projectId": "9a1d4e7b-2c58-4f03-8e6a-1b9c7d2f5a30",
    "title": "Trial expiry reminder",
    "webhookUrl": "https://your-app.com/hooks/trial-expiry",
    "payload": { "userId": "usr_812", "plan": "pro" },
    "fireAt": "2026-06-13T09:30:00.000Z",
    "status": "SCHEDULED",
    "retryCount": 0,
    "createdAt": "2026-06-12T08:14:02.000Z",
    "updatedAt": "2026-06-12T08:14:02.000Z"
  }
}`;

function SchedulingAJob() {
  return (
    <DocSection
      index={sectionIndex("scheduling-a-job")}
      id="scheduling-a-job"
      eyebrow="scheduling a job"
      title="POST /api/v1/jobs"
      lead="One request schedules one job. The job is stored, armed in the scheduler, and fires exactly once at fireAt."
    >
      <Endpoint
        method="POST"
        path="/api/v1/jobs"
        auth="api-key"
        description="Schedules a job. Returns the created job object with a 201."
      >
        <FieldList title="request body">
          <Field name="title" type="string" required>
            Human-readable name, shown in the dashboard and echoed back in
            the webhook payload.
          </Field>
          <Field name="webhookUrl" type="string · url" required>
            The endpoint Dispatch will <K>POST</K> to. Must be a valid URL
            and reachable from wherever Dispatch runs.
          </Field>
          <Field name="fireAt" type="string · ISO 8601 UTC" required>
            When to fire, e.g. <K>2026-06-13T09:30:00Z</K>. Must be UTC
            (trailing <K>Z</K>) and in the future.
          </Field>
          <Field name="payload" type="object">
            Arbitrary JSON delivered in the webhook body. Defaults to{" "}
            <K>{"{}"}</K>.
          </Field>
        </FieldList>
        <div className="grid items-start gap-3 xl:grid-cols-2">
          <CodeBlock code={CREATE_JOB_REQ} lang="bash" title="request" />
          <CodeBlock code={CREATE_JOB_RES} lang="json" title="201 · response" />
        </div>
      </Endpoint>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          what makes a valid fireAt
        </p>
        <P>
          An ISO 8601 timestamp in UTC with a trailing <K>Z</K> —{" "}
          <K>2026-06-13T09:30:00Z</K>. Offsets like <K>+05:30</K> are
          rejected with a 400, and so is any timestamp that isn&apos;t in
          the future. Dispatch arms the timer for the exact millisecond, so
          send the moment you mean, not a rounded-down minute.
        </P>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          what payload is for
        </p>
        <P>
          Whatever JSON you put in <K>payload</K> comes back verbatim in
          the delivery body when the job fires. Use it to carry the context
          your handler needs — a user ID, a plan name — so the handler
          doesn&apos;t have to look anything up to know what the moment
          means. If you omit it, the delivery carries <K>{"{}"}</K>.
        </P>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          what happens after you post
        </p>
        <P>
          The job is written to the database and a timer is armed for{" "}
          <K>fireAt</K>. The 201 response returns the full job object —
          keep <K>data.id</K> if you might cancel later. From there the
          job sits in <K>SCHEDULED</K> until it fires; you can watch it in
          the dashboard the whole way.
        </P>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 05 · Cancelling a job                                               */
/* ------------------------------------------------------------------ */

const CANCEL_JOB_REQ = `curl -X DELETE \\
  https://dispatch-api.imtiyazsayyid.in/api/v1/jobs/3f6c2b8e-7a41-4c9d-9b21-d5a0c3e8f612 \\
  -H "x-api-key: sk_4f8a2c9b51de836b91c0a7e2d4f6a8b0"`;

const CANCEL_JOB_RES = `{
  "status": true,
  "message": "Job cancelled successfully",
  "data": null
}`;

const CANCEL_JOB_400 = `{
  "status": false,
  "message": "Only scheduled jobs can be cancelled",
  "data": null
}`;

function CancellingAJob() {
  return (
    <DocSection
      index={sectionIndex("cancelling-a-job")}
      id="cancelling-a-job"
      eyebrow="cancelling a job"
      title="DELETE /api/v1/jobs/:id"
      lead="Cancellation disarms the timer and parks the job in CANCELLED — terminal, with its history intact."
    >
      <Endpoint
        method="DELETE"
        path="/api/v1/jobs/:id"
        auth="api-key"
        description={
          <>
            Cancels a scheduled job. Only jobs in <K>SCHEDULED</K> state
            can be cancelled — it is the only state where there is still
            anything to call off.
          </>
        }
      >
        <div className="grid items-start gap-3 xl:grid-cols-2">
          <CodeBlock code={CANCEL_JOB_REQ} lang="bash" title="request" />
          <CodeBlock code={CANCEL_JOB_RES} lang="json" title="200 · response" />
        </div>
      </Endpoint>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          cancelling a job that already fired
        </p>
        <P>
          If the job is in any other state — already <K>SUCCESS</K>,
          mid-retry in <K>FAILED</K>, <K>DEAD</K>, or even <K>FIRING</K> at
          that instant — the request returns a 400 and changes nothing:
        </P>
        <CodeBlock
          code={CANCEL_JOB_400}
          lang="json"
          title="400 · response"
          className="max-w-3xl"
        />
        <P>
          A 404 means the job ID doesn&apos;t exist or belongs to a
          different project than the key you used.
        </P>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 06 · Webhook delivery                                               */
/* ------------------------------------------------------------------ */

const DELIVERY_BODY = `{
  "jobId": "3f6c2b8e-7a41-4c9d-9b21-d5a0c3e8f612",
  "title": "Trial expiry reminder",
  "payload": { "userId": "usr_812", "plan": "pro" },
  "firedAt": "2026-06-13T09:30:00.004Z"
}`;

const DELIVERY_HEADERS = `POST /hooks/trial-expiry HTTP/1.1
Content-Type: application/json`;

function WebhookDelivery() {
  return (
    <DocSection
      index={sectionIndex("webhook-delivery")}
      id="webhook-delivery"
      eyebrow="webhook delivery"
      title="What arrives at your endpoint"
      lead="Every delivery is a POST with a JSON body. The shape never varies."
    >
      <CodeBlock
        code={DELIVERY_BODY}
        lang="json"
        title="delivery body"
        className="max-w-3xl"
      />

      <FieldList title="fields">
        <Field name="jobId" type="string · uuid" required>
          The job&apos;s ID — also your idempotency key, since retries can
          deliver the same job more than once.
        </Field>
        <Field name="title" type="string" required>
          The title you scheduled the job with.
        </Field>
        <Field name="payload" type="object" required>
          Exactly the JSON you passed at scheduling time; <K>{"{}"}</K> if
          you passed none.
        </Field>
        <Field name="firedAt" type="string · ISO 8601" required>
          When this attempt actually fired, in UTC.
        </Field>
      </FieldList>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          headers
        </p>
        <CodeBlock
          code={DELIVERY_HEADERS}
          lang="text"
          title="request headers"
          className="max-w-3xl"
        />
        <P>
          <K>Content-Type: application/json</K> is the only header Dispatch
          sets. There is no signature header yet — see{" "}
          <a href="#code-examples" className="text-amber-400 hover:underline">
            verifying the sender
          </a>{" "}
          for the interim approach.
        </P>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          the response dispatch expects
        </p>
        <P>
          Return any <K>2xx</K> to mark the delivery <K>SUCCESS</K>. Any
          other status — or a connection error — marks it <K>FAILED</K> and
          schedules a retry. Whatever body your endpoint returns is captured
          in the delivery log, so a short diagnostic string is worth
          returning; it is what you will read in the dashboard when
          something breaks.
        </P>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          retries
        </p>
        <P>
          The retry clock is fixed: 30 seconds after the first failure, 1
          minute after the second, 5 minutes as the configured ceiling — and
          a job is marked <K>DEAD</K> on its third failed attempt. Every
          attempt is logged with its status code, response body, and
          timing.
        </P>
      </div>

      <Callout tone="warn" legend="timeout · know the gap" className="max-w-3xl">
        Dispatch does not currently set an explicit timeout on the delivery
        request — it waits as long as the Node.js runtime&apos;s default
        fetch limits allow (several minutes). A strict delivery timeout is
        planned. Don&apos;t lean on the gap: respond within a few seconds
        and do slow work after acknowledging.
      </Callout>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 07 · Job lifecycle                                                  */
/* ------------------------------------------------------------------ */

const STATUS_NOTES: {
  status: Parameters<typeof JobStatusBadge>[0]["status"];
  note: React.ReactNode;
}[] = [
  {
    status: "SCHEDULED",
    note: "Armed and waiting for fireAt. The only state a job can be cancelled from — and the state a failed job returns to between retries.",
  },
  {
    status: "FIRING",
    note: "The request to your endpoint is in flight right now.",
  },
  {
    status: "SUCCESS",
    note: "Your endpoint answered 2xx. Terminal.",
  },
  {
    status: "FAILED",
    note: "The last attempt got a non-2xx or a network error. A retry is armed unless this was attempt 3.",
  },
  {
    status: "DEAD",
    note: "Three attempts failed. Dispatch stops; the full attempt history stays in the logs. Terminal.",
  },
  {
    status: "CANCELLED",
    note: "Cancelled via DELETE /jobs/:id before it fired. Terminal.",
  },
];

function JobLifecycle() {
  return (
    <DocSection
      index={sectionIndex("job-lifecycle")}
      id="job-lifecycle"
      eyebrow="job lifecycle"
      title="The state machine"
      lead="Six states, one loop. The same status lamps you see in the dashboard."
    >
      <LifecycleDiagram />

      <Panel className="max-w-3xl divide-y divide-zinc-800/50">
        {STATUS_NOTES.map(({ status, note }) => (
          <div
            key={status}
            className="grid gap-x-4 gap-y-1.5 px-5 py-3.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-baseline"
          >
            <JobStatusBadge status={status} />
            <p className="text-[13px] leading-relaxed text-zinc-400">{note}</p>
          </div>
        ))}
      </Panel>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 08 · Code examples                                                  */
/* ------------------------------------------------------------------ */

const NODE_SCHEDULE = `// dispatch.js — Node 18+, no SDK needed
const DISPATCH_URL = process.env.DISPATCH_URL ?? "https://dispatch-api.imtiyazsayyid.in";
const DISPATCH_API_KEY = process.env.DISPATCH_API_KEY; // sk_...

export async function scheduleJob({ title, webhookUrl, fireAt, payload }) {
  const res = await fetch(\`\${DISPATCH_URL}/api/v1/jobs\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": DISPATCH_API_KEY,
    },
    body: JSON.stringify({
      title,
      webhookUrl,
      fireAt: fireAt.toISOString(), // UTC with trailing Z — required
      payload,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) {
    throw new Error(body?.message ?? \`Dispatch returned \${res.status}\`);
  }
  return body.data; // the created job — keep data.id if you may cancel it
}

const job = await scheduleJob({
  title: "Trial expiry reminder",
  webhookUrl: "https://your-app.com/hooks/trial-expiry",
  fireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  payload: { userId: "usr_812" },
});
console.log(\`scheduled \${job.id}, fires at \${job.fireAt}\`);`;

const PYTHON_SCHEDULE = `# dispatch.py — requests
import os
from datetime import datetime, timedelta, timezone

import requests

DISPATCH_URL = os.environ.get("DISPATCH_URL", "https://dispatch-api.imtiyazsayyid.in")
DISPATCH_API_KEY = os.environ["DISPATCH_API_KEY"]  # sk_...


def schedule_job(title, webhook_url, fire_at, payload=None):
    res = requests.post(
        f"{DISPATCH_URL}/api/v1/jobs",
        headers={"x-api-key": DISPATCH_API_KEY},
        json={
            "title": title,
            "webhookUrl": webhook_url,
            # must be UTC with a trailing Z — isoformat()'s +00:00 is rejected
            "fireAt": fire_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "payload": payload or {},
        },
        timeout=10,
    )
    body = res.json()
    if not res.ok or not body.get("status"):
        raise RuntimeError(body.get("message") or f"Dispatch returned {res.status_code}")
    return body["data"]


job = schedule_job(
    title="Trial expiry reminder",
    webhook_url="https://your-app.com/hooks/trial-expiry",
    fire_at=datetime.now(timezone.utc) + timedelta(days=1),
    payload={"userId": "usr_812"},
)
print(f"scheduled {job['id']}, fires at {job['fireAt']}")`;

const GO_SCHEDULE = `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const dispatchURL = "https://dispatch-api.imtiyazsayyid.in"

type jobRequest struct {
	Title      string         \`json:"title"\`
	WebhookURL string         \`json:"webhookUrl"\`
	FireAt     string         \`json:"fireAt"\`
	Payload    map[string]any \`json:"payload,omitempty"\`
}

func scheduleJob(job jobRequest) (map[string]any, error) {
	body, _ := json.Marshal(job)

	req, err := http.NewRequest(http.MethodPost,
		dispatchURL+"/api/v1/jobs", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", os.Getenv("DISPATCH_API_KEY"))

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var envelope struct {
		Status  bool           \`json:"status"\`
		Message string         \`json:"message"\`
		Data    map[string]any \`json:"data"\`
	}
	if err := json.NewDecoder(res.Body).Decode(&envelope); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}
	if res.StatusCode >= 300 || !envelope.Status {
		return nil, fmt.Errorf("dispatch: %s", envelope.Message)
	}
	return envelope.Data, nil
}

func main() {
	job, err := scheduleJob(jobRequest{
		Title:      "Trial expiry reminder",
		WebhookURL: "https://your-app.com/hooks/trial-expiry",
		// RFC 3339 in UTC ends in Z, which is what Dispatch requires
		FireAt:  time.Now().UTC().Add(24 * time.Hour).Format(time.RFC3339),
		Payload: map[string]any{"userId": "usr_812"},
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("scheduled %s, fires at %s\\n", job["id"], job["fireAt"])
}`;

const PHP_SCHEDULE = `<?php
// dispatch.php — plain cURL extension, PHP 8+

const DISPATCH_URL = 'https://dispatch-api.imtiyazsayyid.in';

function scheduleJob(array $job): array {
    $ch = curl_init(DISPATCH_URL . '/api/v1/jobs');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . getenv('DISPATCH_API_KEY'),
        ],
        CURLOPT_POSTFIELDS => json_encode($job),
    ]);

    $raw = curl_exec($ch);
    if ($raw === false) {
        throw new RuntimeException('Dispatch unreachable: ' . curl_error($ch));
    }
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    $body = json_decode($raw, true);
    if ($status >= 300 || !($body['status'] ?? false)) {
        throw new RuntimeException($body['message'] ?? "Dispatch returned $status");
    }
    return $body['data']; // the created job — keep ['id'] if you may cancel
}

$job = scheduleJob([
    'title'      => 'Trial expiry reminder',
    'webhookUrl' => 'https://your-app.com/hooks/trial-expiry.php',
    // gmdate gives UTC with a trailing Z — exactly what Dispatch requires
    'fireAt'     => gmdate('Y-m-d\\TH:i:s\\Z', time() + 86400),
    'payload'    => ['userId' => 'usr_812'],
]);
echo "scheduled {$job['id']}, fires at {$job['fireAt']}\\n";`;

const CURL_SCHEDULE = `# schedule — POST one job
curl -X POST https://dispatch-api.imtiyazsayyid.in/api/v1/jobs \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $DISPATCH_API_KEY" \\
  -d '{
    "title": "Trial expiry reminder",
    "webhookUrl": "https://your-app.com/hooks/trial-expiry",
    "fireAt": "2026-06-13T09:30:00Z",
    "payload": { "userId": "usr_812" }
  }'

# cancel — only works while the job is still SCHEDULED
curl -X DELETE https://dispatch-api.imtiyazsayyid.in/api/v1/jobs/<job-id> \\
  -H "x-api-key: $DISPATCH_API_KEY"`;

const NODE_RECEIVE = `// server.js — Express
import express from "express";

const app = express();
app.use(express.json());

app.post("/hooks/trial-expiry", (req, res) => {
  const { jobId, title, payload, firedAt } = req.body;

  // Acknowledge with a 2xx first — anything else (including a crash or
  // a slow handler) makes Dispatch retry, so do the heavy work after.
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      // Retries mean at-least-once delivery: use jobId as an idempotency
      // key so a retried delivery can't send the email twice.
      await sendTrialExpiryEmail(jobId, payload.userId);
    } catch (err) {
      console.error(\`hook \${jobId} (\${title}) failed:\`, err);
    }
  });
});

app.listen(5000);`;

const PYTHON_RECEIVE = `# server.py — FastAPI
from fastapi import BackgroundTasks, FastAPI, Request

app = FastAPI()


@app.post("/hooks/trial-expiry")
async def trial_expiry(request: Request, background: BackgroundTasks):
    body = await request.json()
    job_id = body["jobId"]
    payload = body.get("payload") or {}

    # Return the 2xx immediately; Dispatch retries on anything else.
    # Retries mean at-least-once delivery — key your side effects on
    # job_id so a duplicate delivery is a no-op.
    background.add_task(send_trial_expiry_email, job_id, payload.get("userId"))
    return {"received": True}`;

const GO_RECEIVE = `package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type delivery struct {
	JobID   string          \`json:"jobId"\`
	Title   string          \`json:"title"\`
	Payload json.RawMessage \`json:"payload"\`
	FiredAt time.Time       \`json:"firedAt"\`
}

func main() {
	http.HandleFunc("/hooks/trial-expiry", func(w http.ResponseWriter, r *http.Request) {
		var hook delivery
		if err := json.NewDecoder(r.Body).Decode(&hook); err != nil {
			// A malformed body will never improve — don't make Dispatch
			// retry it. Log it and acknowledge.
			log.Printf("bad delivery body: %v", err)
			w.WriteHeader(http.StatusOK)
			return
		}

		// Ack first; retries fire on non-2xx. Process async, keyed on
		// hook.JobID — retries mean at-least-once delivery.
		w.WriteHeader(http.StatusOK)
		go process(hook)
	})

	log.Fatal(http.ListenAndServe(":5000", nil))
}`;

const PHP_RECEIVE = `<?php
// hooks/trial-expiry.php

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || !isset($body['jobId'])) {
    // A malformed body will never improve — acknowledge, don't retry.
    http_response_code(200);
    exit;
}

// Acknowledge before the heavy work so Dispatch isn't kept waiting.
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['received' => true]);
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request(); // flushes the response under PHP-FPM
}

// Retries mean at-least-once delivery — key side effects on jobId so a
// duplicate delivery is a no-op.
sendTrialExpiryEmail($body['jobId'], $body['payload']['userId'] ?? null);`;

const HMAC_PLANNED = `# Planned delivery headers — NOT sent yet:
#
#   x-dispatch-signature: t=1765703400,v1=<hex hmac-sha256>
#
# where v1 = HMAC-SHA256(project_signing_secret, "{t}.{raw_body}").
# Verification will be: recompute the HMAC over the exact raw body,
# compare in constant time, and reject timestamps older than ~5 minutes.`;

const TOKEN_VERIFY = `// Until signatures ship: schedule with a long random token in the URL...
//   webhookUrl: "https://your-app.com/hooks/trial-expiry?token=" + WEBHOOK_TOKEN
// ...and verify it on every delivery, in constant time.

import { timingSafeEqual } from "node:crypto";

function verifyToken(req) {
  const token = Buffer.from(String(req.query.token ?? ""));
  const expected = Buffer.from(process.env.WEBHOOK_TOKEN);
  return token.length === expected.length && timingSafeEqual(token, expected);
}`;

function CodeExamples() {
  return (
    <DocSection
      index={sectionIndex("code-examples")}
      id="code-examples"
      eyebrow="code examples"
      title="Both sides of the wire"
      lead="Scheduling a job from your code, and receiving it on your server. Real snippets — error handling, idempotency, and all."
    >
      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          scheduling a job
        </p>
        <CodeTabs
          tabs={[
            { label: "node.js", code: NODE_SCHEDULE, lang: "js" },
            { label: "python", code: PYTHON_SCHEDULE, lang: "python" },
            { label: "go", code: GO_SCHEDULE, lang: "go" },
            { label: "php", code: PHP_SCHEDULE, lang: "php" },
            { label: "curl", code: CURL_SCHEDULE, lang: "bash" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          handling the webhook
        </p>
        <P>
          The contract is simple: return any 2xx and the delivery is{" "}
          <K>SUCCESS</K>; return anything else — or be unreachable — and
          Dispatch retries with backoff. Two rules follow from it: respond
          before you do the heavy work, and make your handler idempotent,
          because retries mean a delivery can arrive more than once.
        </P>
        <CodeTabs
          tabs={[
            { label: "express", code: NODE_RECEIVE, lang: "js" },
            { label: "fastapi", code: PYTHON_RECEIVE, lang: "python" },
            { label: "go", code: GO_RECEIVE, lang: "go" },
            { label: "php", code: PHP_RECEIVE, lang: "php" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          verifying the sender
        </p>
        <Callout tone="planned" legend="hmac signatures · coming soon">
          Dispatch does not sign deliveries yet. HMAC signatures are the
          next item on the roadmap and will look like this when they ship:
        </Callout>
        <CodeBlock
          code={HMAC_PLANNED}
          lang="bash"
          title="planned · x-dispatch-signature"
        />
        <P>
          In the meantime, don&apos;t accept anonymous POSTs: put a secret
          in the webhook URL when you schedule, and check it on receipt.
          It&apos;s not a signature, but it stops drive-by requests cold.
        </P>
        <CodeBlock
          code={TOKEN_VERIFY}
          lang="js"
          title="interim · shared-token check"
        />
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 09 · API reference                                                  */
/* ------------------------------------------------------------------ */

const BASE_URLS = `https://dispatch-api.imtiyazsayyid.in/api/v1`;

const ENVELOPE = `{
  "status": true,            // false on any error
  "message": "Job scheduled successfully",
  "data": { ... }            // the resource, or null
}`;

const LIST_JOBS_REQ = `curl "https://dispatch-api.imtiyazsayyid.in/api/v1/jobs?status=SCHEDULED&limit=20" \\
  -H "Authorization: Bearer <session-token>"`;

const LIST_JOBS_RES = `{
  "status": true,
  "message": "Jobs fetched successfully",
  "data": {
    "jobs": [
      {
        "id": "3f6c2b8e-7a41-4c9d-9b21-d5a0c3e8f612",
        "title": "Trial expiry reminder",
        "webhookUrl": "https://your-app.com/hooks/trial-expiry",
        "fireAt": "2026-06-13T09:30:00.000Z",
        "status": "SCHEDULED",
        "retryCount": 0,
        "project": { "id": "9a1d4e7b-…", "name": "production" }
      }
    ],
    "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
  }
}`;

const GET_JOB_RES = `{
  "status": true,
  "message": "Job fetched successfully",
  "data": {
    "id": "3f6c2b8e-7a41-4c9d-9b21-d5a0c3e8f612",
    "title": "Trial expiry reminder",
    "status": "SUCCESS",
    "fireAt": "2026-06-13T09:30:00.000Z",
    "project": { "id": "9a1d4e7b-…", "name": "production" },
    "logs": [
      {
        "id": "c81f0a4d-…",
        "attempt": 1,
        "status": "SUCCESS",
        "responseCode": 200,
        "responseBody": "{\\"received\\":true}",
        "firedAt": "2026-06-13T09:30:00.124Z"
      }
    ]
  }
}`;

function ApiReference() {
  return (
    <DocSection
      index={sectionIndex("api-reference")}
      id="api-reference"
      eyebrow="api reference"
      title="The jobs API"
      lead="Plain HTTP and JSON. Scheduling endpoints take your API key; the read endpoints take a dashboard session token."
    >
      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          base url
        </p>
        <CodeBlock
          code={BASE_URLS}
          lang="bash"
          title="base url"
          className="max-w-3xl"
        />
        <P>
          Dispatch is a hosted service — that base URL is all you need.
          (Running your own instance instead? The API is identical; swap in
          your own origin and see the{" "}
          <Link
            href="/docs/self-hosting"
            className="text-amber-400 underline-offset-4 hover:underline"
          >
            self-hosting guide
          </Link>
          .)
        </P>
        <P>
          Every response — success or error — uses the same envelope. On
          errors, <K>status</K> is <K>false</K> and <K>message</K> says
          why, alongside the HTTP status code (400 for validation, 401 for
          bad credentials, 404 for resources that aren&apos;t yours).
        </P>
        <CodeBlock
          code={ENVELOPE}
          lang="json"
          title="response envelope"
          className="max-w-3xl"
        />
      </div>

      <Endpoint
        method="POST"
        path="/api/v1/jobs"
        auth="api-key"
        description={
          <>
            Schedules a job and returns the created job object with a 201.
            Documented in full in{" "}
            <a
              href="#scheduling-a-job"
              className="text-amber-400 hover:underline"
            >
              Scheduling a job
            </a>
            .
          </>
        }
      >
        <FieldList title="request body">
          <Field name="title" type="string" required>
            Human-readable name, echoed back in the webhook payload.
          </Field>
          <Field name="webhookUrl" type="string · url" required>
            The endpoint Dispatch will <K>POST</K> to.
          </Field>
          <Field name="fireAt" type="string · ISO 8601 UTC" required>
            When to fire. Future, UTC, trailing <K>Z</K>.
          </Field>
          <Field name="payload" type="object">
            Arbitrary JSON delivered in the webhook body.
          </Field>
        </FieldList>
      </Endpoint>

      <Endpoint
        method="DELETE"
        path="/api/v1/jobs/:id"
        auth="api-key"
        description={
          <>
            Cancels a <K>SCHEDULED</K> job; 400 for any other state.
            Documented in full in{" "}
            <a
              href="#cancelling-a-job"
              className="text-amber-400 hover:underline"
            >
              Cancelling a job
            </a>
            .
          </>
        }
      />

      <Endpoint
        method="GET"
        path="/api/v1/jobs"
        auth="bearer"
        description="Lists jobs across all of your projects, newest first. This is what the dashboard's jobs page calls."
      >
        <FieldList title="query parameters">
          <Field name="status" type="enum">
            Filter by status: <K>SCHEDULED</K>, <K>FIRING</K>,{" "}
            <K>SUCCESS</K>, <K>FAILED</K>, <K>DEAD</K>, or <K>CANCELLED</K>.
          </Field>
          <Field name="projectId" type="string">
            Limit results to one project.
          </Field>
          <Field name="page" type="number · default 1">
            Page number, starting at 1.
          </Field>
          <Field name="limit" type="number · default 20, max 100">
            Results per page.
          </Field>
        </FieldList>
        <div className="grid items-start gap-3 xl:grid-cols-2">
          <CodeBlock code={LIST_JOBS_REQ} lang="bash" title="request" />
          <CodeBlock code={LIST_JOBS_RES} lang="json" title="200 · response" />
        </div>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/v1/jobs/:id"
        auth="bearer"
        description={
          <>
            Fetches one job with its full delivery history. <K>logs</K> is
            ordered newest first; each entry records the attempt number,
            outcome, response code, and whatever body your endpoint
            returned.
          </>
        }
      >
        <CodeBlock
          code={GET_JOB_RES}
          lang="json"
          title="200 · response (abridged)"
          className="max-w-3xl"
        />
      </Endpoint>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function UsingDispatchPage() {
  return (
    <DocsShell
      crumb="using"
      title="Using Dispatch"
      lead="Integrate scheduled webhooks into your application — from first API key to production delivery."
      sections={SECTIONS}
    >
      <AgentPrompt
        title="Let your AI integrate Dispatch"
        description="Paste this into a coding agent inside your repo. It reads your codebase, finds where scheduling fits, and wires Dispatch in the way this guide describes — client module, webhook handler, env, idempotency, the lot."
        prompt={INTEGRATION_PROMPT}
        fields={[
          {
            key: "DISPATCH_API_KEY",
            label: "api key",
            placeholder: "sk_…",
            sensitive: true,
          },
        ]}
      />
      <Introduction />
      <Quickstart />
      <Authentication />
      <SchedulingAJob />
      <CancellingAJob />
      <WebhookDelivery />
      <JobLifecycle />
      <CodeExamples />
      <ApiReference />
    </DocsShell>
  );
}
