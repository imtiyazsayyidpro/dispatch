import type { Metadata } from "next";

import { Panel } from "@/components/app/panel";
import { AgentPrompt } from "@/components/docs/agent-prompt";
import { CodeBlock } from "@/components/docs/code-block";
import type { DocSectionLink } from "@/components/docs/docs-nav";
import { DocsShell } from "@/components/docs/docs-shell";
import {
  Callout,
  DocSection,
  Field,
  FieldList,
  K,
  P,
} from "@/components/docs/primitives";

export const metadata: Metadata = {
  title: "Self-hosting — Dispatch Docs",
  description:
    "Run Dispatch on your own server: installation, environment variables, PM2, nginx, upgrades, and known limitations.",
};

const SECTIONS: DocSectionLink[] = [
  { id: "overview", label: "Overview", short: "overview" },
  { id: "prerequisites", label: "Prerequisites", short: "prereqs" },
  { id: "installation", label: "Installation", short: "install" },
  { id: "production", label: "Running in production", short: "production" },
  { id: "reverse-proxy", label: "Reverse proxy", short: "nginx" },
  { id: "env-reference", label: "Environment variables", short: "env" },
  { id: "local-development", label: "Local development", short: "local dev" },
  { id: "upgrading", label: "Upgrading", short: "upgrading" },
  { id: "limitations", label: "Known limitations", short: "limitations" },
];

function sectionIndex(id: string) {
  return String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/* AI setup                                                            */
/* ------------------------------------------------------------------ */

const SETUP_PROMPT = `You are a senior DevOps engineer helping me self-host Dispatch, an open-source webhook scheduler (github.com/imtiyazsayyid/dispatch). Work conversationally: one stage at a time, confirm each stage works before moving to the next, and when something fails, debug it with me from my actual output before continuing.

My environment:
- Server OS: {{SERVER_OS}}
- Notes about my setup: {{SETUP_NOTES}}

## What Dispatch is
Two Node.js apps in one repo, plus MySQL:
- scheduler-backend — Express API and the scheduler itself; in-memory job timers; listens on port 4000 by default
- scheduler-web — Next.js dashboard; listens on port 3000
Target production layout: both processes under PM2, nginx in front with path-based routing on one domain (/api/* to :4000, everything else to :3000), TLS via certbot.

## Ground rules for you
- Start with preflight questions about what I already have: Node version (20+ required), MySQL 8+ (installed? can I create databases?), whether DNS already points a domain at this server, whether ports 80/443 are open, and whether nginx and PM2 are already installed.
- Give one stage at a time with exact commands for my OS, then wait for me to confirm or paste output before continuing.
- When I paste an error, diagnose from the actual text — do not guess ahead or dump the remaining stages.
- Tell me when a command needs sudo and why. Prefer boring, reversible steps.
- NEVER suggest running more than one instance of scheduler-backend — no PM2 cluster mode, no second replica behind a load balancer. Job timers live in process memory; two instances would fire every webhook twice.

## The stages
1. Preflight — versions, MySQL, DNS, open ports, existing nginx/PM2.
2. Database — create a "dispatch" database and a dedicated MySQL user with rights on it.
3. The API — git clone the repo; create scheduler-backend/.env with exactly two variables:
     PORT=4000
     DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/dispatch
   then: npm install && npx prisma migrate deploy && npm run build
4. The dashboard — create scheduler-web/.env.local with exactly one variable:
     NEXT_PUBLIC_API_URL=https://MY-DOMAIN
   (same origin as the dashboard because of path routing; no trailing slash, no /api/v1 suffix; it is inlined at build time, so it must be set BEFORE npm run build, and changing it later requires a rebuild)
   then: npm install && npm run build
5. PM2 — ecosystem.config.js at the repo root declaring both apps with instances: 1 and exec_mode "fork"; pm2 start ecosystem.config.js, pm2 save, pm2 startup.
6. nginx — one server block for MY-DOMAIN: location /api/ proxies to 127.0.0.1:4000 (the API serves everything under /api/v1, and longest-prefix match means this block wins), location / proxies to 127.0.0.1:3000. nginx -t, reload, then certbot --nginx for TLS.
7. Verify end-to-end — register at https://MY-DOMAIN, create a project and an API key in the dashboard, schedule a test job with curl set to fire two minutes out, and watch it flip SCHEDULED → FIRING → SUCCESS in the dashboard.

## Known limitations to keep in mind while advising me
- If the API process is down when a job's fireAt passes, that job is never fired retroactively — boot-time rehydration only re-arms future-dated jobs. Restarts should be quick and deliberate.
- Webhook deliveries currently have no explicit timeout and are not HMAC-signed — flag this if I describe anything security-sensitive.
- Single-server only: there is no distributed mode.

Start now with the preflight questions. Keep each message short and practical.`;

/* ------------------------------------------------------------------ */
/* 01 · Overview                                                       */
/* ------------------------------------------------------------------ */

function Overview() {
  return (
    <DocSection
      index={sectionIndex("overview")}
      id="overview"
      eyebrow="overview"
      title="Your box, your schedule"
      lead="Self-hosting means running both halves of Dispatch — the API (which owns the scheduler) and the web dashboard — on infrastructure you control, with your jobs in your own MySQL."
    >
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400 uppercase">
            what you get
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-400">
            <li>The full product, MIT-licensed — not a gutted community edition</li>
            <li>Every job, payload, and delivery log in your own database</li>
            <li>Webhooks that can reach services inside your network</li>
            <li>No usage limits beyond what your server can do</li>
          </ul>
        </Panel>
        <Panel className="p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
            what you own
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-400">
            <li>
              Uptime — if the API process is down at <K>fireAt</K>, that
              job never fires (see{" "}
              <a href="#limitations" className="text-amber-400 hover:underline">
                limitations
              </a>
              )
            </li>
            <li>Database backups and credentials</li>
            <li>TLS, DNS, and the reverse proxy in front</li>
            <li>Applying upgrades and their migrations</li>
          </ul>
        </Panel>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 02 · Prerequisites                                                  */
/* ------------------------------------------------------------------ */

const PREREQS: { name: string; note: React.ReactNode }[] = [
  {
    name: "Node.js 20+",
    note: "Runs both the API and the dashboard. The scheduler relies on modern fetch, which ships with Node 18+, but 20 is the supported floor.",
  },
  {
    name: "MySQL 8+",
    note: "The only datastore. Prisma manages the schema; you manage the backups.",
  },
  {
    name: "A server",
    note: "Any VPS works — Dispatch is two Node processes and idle timers, not a resource hog. One box is the supported topology.",
  },
  {
    name: "nginx + PM2 familiarity",
    note: "The production setup below assumes you can edit an nginx site config and read pm2 status output. Nothing deeper.",
  },
];

function Prerequisites() {
  return (
    <DocSection
      index={sectionIndex("prerequisites")}
      id="prerequisites"
      eyebrow="prerequisites"
      title="What you need first"
    >
      <Panel className="max-w-3xl divide-y divide-zinc-800/50">
        {PREREQS.map((item, i) => (
          <div key={item.name} className="flex items-baseline gap-4 px-5 py-3.5">
            <span className="shrink-0 font-mono text-[10px] tracking-wider text-amber-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-100">{item.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
                {item.note}
              </p>
            </div>
          </div>
        ))}
      </Panel>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 03 · Installation                                                   */
/* ------------------------------------------------------------------ */

const INSTALL_CLONE = `git clone https://github.com/imtiyazsayyid/dispatch
cd dispatch`;

const INSTALL_BACKEND_ENV = `# scheduler-backend/.env

# Port the API listens on — keep in sync with the nginx upstream below.
PORT=4000

# MySQL connection string, used by Prisma at runtime and for migrations.
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=mysql://dispatch:change-me@localhost:3306/dispatch`;

const INSTALL_WEB_ENV = `# scheduler-web/.env.local

# Public origin of the Dispatch API — the browser calls it directly.
# With the path-routed nginx setup below, it's the same origin as the
# dashboard. No trailing slash, no /api/v1 suffix. Inlined at build
# time: set it BEFORE \`next build\`, rebuild if it changes.
NEXT_PUBLIC_API_URL=https://dispatch.example.com`;

const INSTALL_BUILD = `# the API
cd scheduler-backend
npm install
npx prisma migrate deploy   # creates/updates the schema in MySQL
npm run build

# the dashboard
cd ../scheduler-web
npm install
npm run build               # NEXT_PUBLIC_API_URL must be set by now`;

function Installation() {
  return (
    <DocSection
      index={sectionIndex("installation")}
      id="installation"
      eyebrow="installation"
      title="Clone, configure, migrate, build"
      lead="The repo holds both apps side by side: scheduler-backend (the API and scheduler) and scheduler-web (the dashboard)."
    >
      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          01 · clone
        </p>
        <CodeBlock code={INSTALL_CLONE} lang="bash" className="max-w-3xl" />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          02 · configure the api
        </p>
        <P>
          Create a MySQL database (and ideally a dedicated user), then copy{" "}
          <K>.env.example</K> to <K>.env</K> and fill it in. Both variables
          are documented in the{" "}
          <a href="#env-reference" className="text-amber-400 hover:underline">
            reference
          </a>{" "}
          below.
        </P>
        <CodeBlock
          code={INSTALL_BACKEND_ENV}
          lang="ini"
          title="scheduler-backend/.env"
          className="max-w-3xl"
        />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          03 · configure the dashboard
        </p>
        <CodeBlock
          code={INSTALL_WEB_ENV}
          lang="ini"
          title="scheduler-web/.env.local"
          className="max-w-3xl"
        />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          04 · migrate and build
        </p>
        <CodeBlock code={INSTALL_BUILD} lang="bash" className="max-w-3xl" />
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 04 · Running in production                                          */
/* ------------------------------------------------------------------ */

const PM2_ECOSYSTEM = `// ecosystem.config.js — at the repo root
module.exports = {
  apps: [
    {
      name: "dispatch-api",
      cwd: "./scheduler-backend",
      script: "npm",
      args: "start",
      instances: 1,          // never more — timers live in process memory
      exec_mode: "fork",     // never cluster, for the same reason
      autorestart: true,
      env: { NODE_ENV: "production" },
    },
    {
      name: "dispatch-web",
      cwd: "./scheduler-web",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env: { NODE_ENV: "production" },
    },
  ],
};`;

const PM2_START = `npm install -g pm2

pm2 start ecosystem.config.js
pm2 save        # persist the process list
pm2 startup     # then run the command it prints — survives reboots

pm2 status      # both apps should read "online"
pm2 logs dispatch-api`;

function Production() {
  return (
    <DocSection
      index={sectionIndex("production")}
      id="production"
      eyebrow="running in production"
      title="PM2 keeps both alive"
      lead="One ecosystem file declares both processes; PM2 restarts them on crash and on reboot."
    >
      <CodeBlock
        code={PM2_ECOSYSTEM}
        lang="js"
        title="ecosystem.config.js"
        className="max-w-3xl"
      />
      <CodeBlock code={PM2_START} lang="bash" className="max-w-3xl" />

      <Callout tone="warn" legend="one api process, always" className="max-w-3xl">
        Job timers live in the API process&apos;s memory. Run exactly one
        instance of <K>dispatch-api</K> — never PM2 cluster mode, never a
        second replica behind a load balancer. Two instances would each arm
        timers for the same jobs and fire your webhooks twice. The
        dashboard, by contrast, is stateless; scale it if you ever need to.
      </Callout>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 05 · Reverse proxy                                                  */
/* ------------------------------------------------------------------ */

const NGINX_CONF = `# /etc/nginx/sites-available/dispatch
# One domain, two upstreams: /api/* goes to the API, the rest to the
# dashboard. Longest-prefix match means the /api/ block always wins.

upstream dispatch_web { server 127.0.0.1:3000; }
upstream dispatch_api { server 127.0.0.1:4000; }

server {
    listen 80;
    server_name dispatch.example.com;

    # the API serves everything under /api (routes live at /api/v1/...)
    location /api/ {
        proxy_pass http://dispatch_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # everything else is the dashboard
    location / {
        proxy_pass http://dispatch_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

const NGINX_ENABLE = `sudo ln -s /etc/nginx/sites-available/dispatch /etc/nginx/sites-enabled/dispatch
sudo nginx -t && sudo systemctl reload nginx

# TLS — certbot rewrites the config for HTTPS
sudo certbot --nginx -d dispatch.example.com`;

function ReverseProxy() {
  return (
    <DocSection
      index={sectionIndex("reverse-proxy")}
      id="reverse-proxy"
      eyebrow="reverse proxy"
      title="nginx in front of both"
      lead="The dashboard's browser code calls the API directly, so both have to be publicly reachable. Path-based routing puts them behind one domain."
    >
      <CodeBlock
        code={NGINX_CONF}
        lang="nginx"
        title="/etc/nginx/sites-available/dispatch"
        className="max-w-3xl"
      />
      <CodeBlock code={NGINX_ENABLE} lang="bash" className="max-w-3xl" />
      <P>
        Because the API is reached at the same origin as the dashboard,{" "}
        <K>NEXT_PUBLIC_API_URL</K> is simply{" "}
        <K>https://dispatch.example.com</K> — the web app appends{" "}
        <K>/api/v1/…</K> paths itself.
      </P>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 06 · Environment variables reference                                */
/* ------------------------------------------------------------------ */

function EnvReference() {
  return (
    <DocSection
      index={sectionIndex("env-reference")}
      id="env-reference"
      eyebrow="environment variables"
      title="Every variable"
      lead="Three variables run the whole thing. Anything else you find in an env file is not read by Dispatch."
    >
      <FieldList title="scheduler-backend/.env">
        <Field name="PORT" type="number · default 4000">
          Port the API listens on. Keep it in sync with the nginx upstream.
          Example: <K>4000</K>
        </Field>
        <Field name="DATABASE_URL" type="string · mysql url" required>
          MySQL connection string, used by Prisma at runtime and by{" "}
          <K>prisma migrate</K>. Example:{" "}
          <K>mysql://dispatch:secret@localhost:3306/dispatch</K>
        </Field>
      </FieldList>

      <FieldList title="scheduler-web/.env.local">
        <Field name="NEXT_PUBLIC_API_URL" type="string · origin" required>
          Public origin the browser uses to reach the API — with the
          path-routed nginx setup, the same origin as the dashboard. No
          trailing slash, no <K>/api/v1</K> suffix. Inlined at build time:
          it must be set before <K>next build</K>, and a change requires a
          rebuild. Example: <K>https://dispatch.example.com</K>
        </Field>
      </FieldList>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 07 · Local development                                              */
/* ------------------------------------------------------------------ */

const LOCAL_DEV = `# 1 · database
mysql -u root -e "CREATE DATABASE dispatch"

# 2 · the API — terminal one
cd scheduler-backend
npm install
cp .env.example .env        # point DATABASE_URL at your MySQL
npx prisma migrate dev
npm run dev                 # http://localhost:4000, hot-reloads

# 3 · the dashboard — terminal two
cd scheduler-web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev                 # http://localhost:3000`;

const NGROK_SETUP = `# your webhook handler is listening on :5000
ngrok http 5000`;

const NGROK_OUTPUT = `Session Status        online
Web Interface         http://127.0.0.1:4040
Forwarding            https://f3a1-203-0-113-7.ngrok-free.app -> http://localhost:5000`;

const NGROK_USE = `# schedule against the forwarding URL
curl -X POST https://dispatch.example.com/api/v1/jobs \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_your_key_here" \\
  -d '{
    "title": "Local webhook test",
    "webhookUrl": "https://f3a1-203-0-113-7.ngrok-free.app/hooks/test",
    "fireAt": "2026-06-12T12:02:00Z",
    "payload": { "hello": "local" }
  }'`;

function LocalDevelopment() {
  return (
    <DocSection
      index={sectionIndex("local-development")}
      id="local-development"
      eyebrow="local development"
      title="Developing against Dispatch"
      lead="Both halves run locally in dev mode, and there's a well-worn answer to testing webhooks on localhost."
    >
      <CodeBlock
        code={LOCAL_DEV}
        lang="bash"
        title="dev setup"
        className="max-w-3xl"
      />

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          testing webhooks locally
        </p>
        <P>
          The question every developer hits first: &quot;my handler runs on
          my laptop — what do I put in <K>webhookUrl</K>?&quot; It depends
          on where Dispatch is running:
        </P>
        <P>
          <strong className="font-medium text-zinc-200">
            Dispatch running locally too?
          </strong>{" "}
          No tunnel needed. The scheduler fires from the backend process on
          your machine, so <K>http://localhost:5000/hooks/test</K> works as
          a <K>webhookUrl</K> directly.
        </P>
        <P>
          <strong className="font-medium text-zinc-200">
            Dispatch hosted somewhere else?
          </strong>{" "}
          It can&apos;t reach your localhost — you need a tunnel. ngrok is
          the standard move:
        </P>
        <CodeBlock code={NGROK_SETUP} lang="bash" className="max-w-3xl" />
        <CodeBlock
          code={NGROK_OUTPUT}
          lang="text"
          title="ngrok output"
          className="max-w-3xl"
        />
        <CodeBlock
          code={NGROK_USE}
          lang="bash"
          title="schedule against the tunnel"
          className="max-w-3xl"
        />
      </div>

      <Callout tone="info" legend="ngrok field notes" className="max-w-3xl">
        <ul className="space-y-1.5">
          <li>
            On the free plan the forwarding URL changes every restart —
            jobs scheduled against a dead tunnel will fail and retry into
            the void. Claim ngrok&apos;s free static domain so the URL
            survives restarts.
          </li>
          <li>
            The web interface at <K>http://127.0.0.1:4040</K> shows every
            delivery ngrok forwarded — request body, your response, timing.
            It pairs perfectly with the Dispatch delivery log for debugging
            both sides.
          </li>
          <li>
            Deliveries that failed while your tunnel was down are retried
            on the normal 30s → 1m backoff, so a quick tunnel restart often
            catches the retry.
          </li>
        </ul>
      </Callout>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 08 · Upgrading                                                      */
/* ------------------------------------------------------------------ */

const UPGRADE = `cd dispatch
git pull

# the API
cd scheduler-backend
npm install
npx prisma migrate deploy   # applies any new migrations; safe to re-run
npm run build

# the dashboard
cd ../scheduler-web
npm install
npm run build

# restart both
pm2 restart dispatch-api dispatch-web`;

function Upgrading() {
  return (
    <DocSection
      index={sectionIndex("upgrading")}
      id="upgrading"
      eyebrow="upgrading"
      title="Pull, migrate, rebuild, restart"
      lead="Migrations are additive and applied with prisma migrate deploy — it only runs what hasn't run yet."
    >
      <CodeBlock code={UPGRADE} lang="bash" className="max-w-3xl" />
      <P>
        On boot the API re-arms every future-dated <K>SCHEDULED</K> job
        from the database, so scheduled work survives the restart. But jobs
        whose <K>fireAt</K> lands <em>inside</em> the restart window are
        missed (see{" "}
        <a href="#limitations" className="text-amber-400 hover:underline">
          limitations
        </a>
        ) — upgrade in a quiet minute and check <K>pm2 logs</K> for the
        rehydration line afterwards.
      </P>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 09 · Known limitations                                              */
/* ------------------------------------------------------------------ */

const LIMITATIONS: { name: string; body: React.ReactNode }[] = [
  {
    name: "Downtime means missed fires",
    body: (
      <>
        Rehydration on boot only re-arms jobs whose <K>fireAt</K> is still
        in the future. A job that came due while the process was down is
        never fired retroactively — it stays <K>SCHEDULED</K> in the
        dashboard forever. Catch-up delivery is a known gap; keep the API
        process running.
      </>
    ),
  },
  {
    name: "No explicit delivery timeout",
    body: (
      <>
        The webhook request has no timeout of its own — it waits as long as
        Node&apos;s default fetch limits allow (several minutes). A slow
        endpoint ties up the attempt for that long. A strict timeout is
        planned; until then, respond fast.
      </>
    ),
  },
  {
    name: "No HMAC signing yet",
    body: (
      <>
        Deliveries are not signed, so your endpoint can&apos;t
        cryptographically verify the sender. Use an unguessable token in
        the webhook URL as an interim check — the pattern is in the{" "}
        <a
          href="/docs/using#code-examples"
          className="text-amber-400 hover:underline"
        >
          Using Dispatch guide
        </a>
        .
      </>
    ),
  },
  {
    name: "Single server only",
    body: (
      <>
        There is no distributed lock. Timers live in one process&apos;s
        memory, and two API instances would each fire the same jobs —
        doubling every webhook. One instance, fork mode, exactly one box.
      </>
    ),
  },
];

function Limitations() {
  return (
    <DocSection
      index={sectionIndex("limitations")}
      id="limitations"
      eyebrow="known limitations"
      title="The honest list"
      lead="Things Dispatch does not handle yet. Read this before you put it in front of anything critical."
    >
      <Panel className="max-w-3xl divide-y divide-zinc-800/50">
        {LIMITATIONS.map((item, i) => (
          <div key={item.name} className="px-5 py-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] tracking-wider text-zinc-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-sm font-medium text-zinc-100">{item.name}</h3>
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400">
              {item.body}
            </p>
          </div>
        ))}
      </Panel>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SelfHostingPage() {
  return (
    <DocsShell
      crumb="self-hosting"
      title="Self-hosting Dispatch"
      lead="Run the whole thing on your own server: install, configure, proxy, keep it alive, and upgrade without losing the schedule."
      sections={SECTIONS}
    >
      <AgentPrompt
        title="Get AI help setting this up"
        description="Paste this into Claude, ChatGPT, or Gemini. It plays senior DevOps engineer: asks what's already on your server, walks you through one stage at a time, and debugs from your real output when something fails."
        prompt={SETUP_PROMPT}
        worksWith="works with claude · chatgpt · gemini · any conversational ai"
        fields={[
          {
            key: "SERVER_OS",
            label: "server os",
            placeholder: "Ubuntu 24.04",
          },
          {
            key: "SETUP_NOTES",
            label: "anything specific · optional",
            placeholder: "MySQL already running; domain is dispatch.acme.dev",
          },
        ]}
      />
      <Overview />
      <Prerequisites />
      <Installation />
      <Production />
      <ReverseProxy />
      <EnvReference />
      <LocalDevelopment />
      <Upgrading />
      <Limitations />
    </DocsShell>
  );
}
