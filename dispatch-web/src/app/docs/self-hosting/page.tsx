import type { Metadata } from "next";

import { Panel } from "@/components/app/panel";
import { AgentPrompt } from "@/components/docs/agent-prompt";
import { CodeBlock } from "@/components/docs/code-block";
import type { DocSectionLink } from "@/components/docs/docs-nav";
import { DocsShell } from "@/components/docs/docs-shell";
import { Callout, DocSection, Field, FieldList, K, P } from "@/components/docs/primitives";

export const metadata: Metadata = {
  title: "Self-hosting — Dispatch Docs",
  description: "Run Dispatch on your own server: installation, environment variables, PM2, nginx, upgrades, and known limitations.",
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

const SETUP_PROMPT = `You are a senior DevOps engineer helping me self-host Dispatch, an open-source webhook scheduler (github.com/imtiyazsayyidpro/dispatch). Work conversationally: one stage at a time, confirm each stage works before moving to the next, and when something fails, debug it with me from my actual output before continuing.

My environment:
- Server OS: {{SERVER_OS}}
- Notes about my setup: {{SETUP_NOTES}}

## What Dispatch is
Two Node.js apps in one repo, plus MySQL/MariaDB:
- dispatch-backend — Express API and the scheduler itself; listens on port 4000 by default. The scheduler is DB-backed: it claims each job atomically before firing and runs a self-healing sweep, so missed jobs are caught up after downtime.
- dispatch-web — Next.js dashboard; listens on port 3000
Target production layout: both processes under PM2, nginx in front. The default is one domain with path-based routing (/api/* to :4000, everything else to :3000); separate domains for the API and dashboard also work (see the CORS note below). TLS via certbot.

## Ground rules for you
- Start with preflight questions about what I already have: Node version (20+ required), MySQL 8+ / MariaDB (installed? can I create databases?), whether DNS already points a domain at this server, whether ports 80/443 are open, whether nginx and PM2 are installed, and whether I have a Gmail account with an App Password for transactional email (Dispatch sends a verification code on signup, so email must be configured or registration fails).
- Give one stage at a time with exact commands for my OS, then wait for me to confirm or paste output before continuing.
- When I paste an error, diagnose from the actual text — do not guess ahead or dump the remaining stages.
- Tell me when a command needs sudo and why. Prefer boring, reversible steps.

## The stages
1. Preflight — versions, MySQL/MariaDB, DNS, open ports, existing nginx/PM2, Gmail App Password.
2. Database — create a "dispatch" database and a dedicated user with rights on it.
3. The API — git clone the repo; create dispatch-backend/.env (copy from .env.example). The important variables:
     DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/dispatch   (required)
     GMAIL_USER + GMAIL_APP_PASSWORD                              (required — signup sends a code)
     FRONTEND_URL=https://MY-DASHBOARD-URL                        (used in password-reset links)
     CORS_ORIGINS=https://MY-DASHBOARD-URL                        (only if the dashboard is on a different origin)
     TRUST_PROXY=true                                            (it runs behind nginx)
   then: npm install (auto-runs prisma generate) && npx prisma migrate deploy && npm run build
4. The dashboard — create dispatch-web/.env.local with one variable:
     NEXT_PUBLIC_API_URL=https://MY-API-URL
   (with single-domain path routing this is the same origin as the dashboard; with split domains it's the API's domain. No trailing slash, no /api/v1 suffix; it is inlined at build time, so set it BEFORE npm run build, and changing it later needs a rebuild)
   then: npm install && npm run build
5. PM2 — ecosystem.config.js at the repo root declaring both apps; pm2 start ecosystem.config.js, pm2 save, pm2 startup.
6. nginx — single domain: location /api/ proxies to 127.0.0.1:4000, location / proxies to 127.0.0.1:3000. (Split domains: one server block per domain instead.) nginx -t, reload, then certbot --nginx for TLS.
7. Verify end-to-end — register at the dashboard, confirm the verification email arrives, create a project and an API key, schedule a test job with curl set to fire two minutes out, and watch it flip SCHEDULED → FIRING → SUCCESS.

## Good to know while advising me
- The scheduler survives restarts: on boot it catches up any jobs that came due during downtime, and a background sweep re-checks every 15s. Webhook calls have a 30s timeout; failed deliveries retry on a 30s → 1m → 5m backoff that also survives restarts.
- Running more than one API instance is safe — jobs are claimed atomically, so they are never double-fired. The one caveat: rate limiting is in-memory per instance, so a shared store (e.g. Redis) is needed if you want global limits across replicas.
- Webhook deliveries are not HMAC-signed yet — flag this if I describe anything security-sensitive.
- By default the API blocks webhooks aimed at private/internal addresses (SSRF guard). If I deliberately want to hit services inside my network, set ALLOW_PRIVATE_WEBHOOKS=true.

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
          <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400 uppercase">what you get</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-400">
            <li>The full product, MIT-licensed — not a gutted community edition</li>
            <li>Every job, payload, and delivery log in your own database</li>
            <li>
              Webhooks that can reach services inside your network — opt in with <K>ALLOW_PRIVATE_WEBHOOKS</K>
            </li>
            <li>No usage limits beyond what your server can do</li>
          </ul>
        </Panel>
        <Panel className="p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">what you own</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-400">
            <li>Database backups and credentials</li>
            <li>TLS, DNS, and the reverse proxy in front</li>
            <li>An SMTP/Gmail account for transactional email</li>
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
    name: "MySQL 8+ or MariaDB",
    note: "The only datastore. Prisma manages the schema; you manage the backups.",
  },
  {
    name: "A Gmail App Password",
    note: "Dispatch emails a verification code on signup and links for password resets, so transactional email must be configured. A Gmail account with a 16-character App Password is the path of least resistance.",
  },
  {
    name: "A server with nginx + PM2",
    note: "Any VPS works — Dispatch is two Node processes and a light DB poll, not a resource hog. The production setup assumes you can edit an nginx site config and read pm2 status output.",
  },
];

function Prerequisites() {
  return (
    <DocSection index={sectionIndex("prerequisites")} id="prerequisites" eyebrow="prerequisites" title="What you need first">
      <Panel className="max-w-3xl divide-y divide-zinc-800/50">
        {PREREQS.map((item, i) => (
          <div key={item.name} className="flex items-baseline gap-4 px-5 py-3.5">
            <span className="shrink-0 font-mono text-[10px] tracking-wider text-amber-400">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-sm font-medium text-zinc-100">{item.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{item.note}</p>
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

const INSTALL_CLONE = `git clone https://github.com/imtiyazsayyidpro/dispatch
cd dispatch`;

const INSTALL_BACKEND_ENV = `# dispatch-backend/.env

# MySQL/MariaDB connection string — used by Prisma at runtime and for
# migrations. Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=mysql://dispatch:change-me@localhost:3306/dispatch

# Port the API listens on — keep in sync with the nginx upstream below.
PORT=4000

# Transactional email. Signup sends a verification code, so these are
# required. GMAIL_APP_PASSWORD is a 16-char App Password, not your login:
# https://myaccount.google.com/apppasswords
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx

# Public URL of the dashboard — used to build password-reset links.
FRONTEND_URL=https://dispatch.example.com

# Only needed if the dashboard is served from a DIFFERENT origin than the
# API (split-domain setup). Comma-separated list of allowed browser origins.
CORS_ORIGINS=https://dispatch.example.com

# It runs behind nginx, so trust the proxy for real client IPs (rate limiting).
TRUST_PROXY=true`;

const INSTALL_WEB_ENV = `# dispatch-web/.env.local

# Public origin of the Dispatch API — the browser calls it directly.
# With the path-routed nginx setup below, it's the same origin as the
# dashboard. No trailing slash, no /api/v1 suffix. Inlined at build
# time: set it BEFORE \`next build\`, rebuild if it changes.
NEXT_PUBLIC_API_URL=https://dispatch.example.com`;

const INSTALL_BUILD = `# the API
cd dispatch-backend
npm install                 # also runs 'prisma generate' (postinstall)
npx prisma migrate deploy   # creates/updates the schema in MySQL
npm run build

# the dashboard
cd ../dispatch-web
npm install
npm run build               # NEXT_PUBLIC_API_URL must be set by now`;

function Installation() {
  return (
    <DocSection
      index={sectionIndex("installation")}
      id="installation"
      eyebrow="installation"
      title="Clone, configure, migrate, build"
      lead="The repo holds both apps side by side: dispatch-backend (the API and scheduler) and dispatch-web (the dashboard)."
    >
      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">01 · clone</p>
        <CodeBlock code={INSTALL_CLONE} lang="bash" className="max-w-3xl" />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">02 · configure the api</p>
        <P>
          Create a MySQL database (and ideally a dedicated user), then copy <K>.env.example</K> to <K>.env</K> and fill it in. Every variable is documented in the{" "}
          <a href="#env-reference" className="text-amber-400 hover:underline">
            reference
          </a>{" "}
          below.
        </P>
        <CodeBlock code={INSTALL_BACKEND_ENV} lang="ini" title="dispatch-backend/.env" className="max-w-3xl" />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">03 · configure the dashboard</p>
        <CodeBlock code={INSTALL_WEB_ENV} lang="ini" title="dispatch-web/.env.local" className="max-w-3xl" />
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">04 · migrate and build</p>
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
      name: "api-dispatch",
      cwd: "./dispatch-backend",
      script: "npm",
      args: "start",
      instances: 1,          // one box needs only one; safe to scale (see below)
      exec_mode: "fork",
      autorestart: true,
      env: { NODE_ENV: "production" },
    },
    {
      name: "dispatch-web",
      cwd: "./dispatch-web",
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
pm2 logs api-dispatch`;

function Production() {
  return (
    <DocSection
      index={sectionIndex("production")}
      id="production"
      eyebrow="running in production"
      title="PM2 keeps both alive"
      lead="One ecosystem file declares both processes; PM2 restarts them on crash and on reboot."
    >
      <CodeBlock code={PM2_ECOSYSTEM} lang="js" title="ecosystem.config.js" className="max-w-3xl" />
      <CodeBlock code={PM2_START} lang="bash" className="max-w-3xl" />

      <Callout tone="info" legend="scaling the api" className="max-w-3xl">
        One API instance is plenty for a single box, but Dispatch is safe to scale: every job is claimed atomically (<K>SCHEDULED → FIRING</K> in a single conditional update) before it fires, so two instances will never
        double-send a webhook. The only caveat is that rate limiting is in-memory per process — add a shared store (e.g. Redis) if you want limits enforced globally across replicas. The dashboard is stateless; scale it
        freely.
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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # everything else is the dashboard
    location / {
        proxy_pass http://dispatch_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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
      lead="The dashboard's browser code calls the API directly, so both have to be publicly reachable. Path-based routing puts them behind one domain — the simplest option, and it sidesteps CORS entirely."
    >
      <CodeBlock code={NGINX_CONF} lang="nginx" title="/etc/nginx/sites-available/dispatch" className="max-w-3xl" />
      <CodeBlock code={NGINX_ENABLE} lang="bash" className="max-w-3xl" />
      <P>
        Because the API is reached at the same origin as the dashboard, <K>NEXT_PUBLIC_API_URL</K> is simply <K>https://dispatch.example.com</K> — the web app appends <K>/api/v1/…</K> paths itself, and same-origin
        requests need no CORS config.
      </P>
      <Callout tone="info" legend="prefer separate domains?" className="max-w-3xl">
        You can instead give the API and dashboard their own domains (e.g. <K>api.example.com</K> and <K>app.example.com</K>) with a server block each. Two extra steps then matter: set <K>NEXT_PUBLIC_API_URL</K> to the
        API&apos;s domain, and list the dashboard&apos;s origin in <K>CORS_ORIGINS</K> on the API — otherwise the browser blocks the cross-origin calls.
      </Callout>
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
      lead="The API reads a handful; the dashboard reads one. Anything else you find in an env file is not read by Dispatch."
    >
      <FieldList title="dispatch-backend/.env">
        <Field name="DATABASE_URL" type="string · mysql url" required>
          MySQL/MariaDB connection string, used by Prisma at runtime and by <K>prisma migrate</K>. Example: <K>mysql://dispatch:secret@localhost:3306/dispatch</K>
        </Field>
        <Field name="PORT" type="number · default 4000">
          Port the API listens on. Keep it in sync with the nginx upstream. Example: <K>4000</K>
        </Field>
        <Field name="GMAIL_USER" type="string · email" required>
          Gmail address that sends verification codes and reset links. Signup fails without working email. Example: <K>you@gmail.com</K>
        </Field>
        <Field name="GMAIL_APP_PASSWORD" type="string" required>
          A 16-character Google{" "}
          <a href="https://myaccount.google.com/apppasswords" className="text-amber-400 hover:underline">
            App Password
          </a>{" "}
          — not your normal account password.
        </Field>
        <Field name="FRONTEND_URL" type="string · url" required>
          Public origin of the dashboard, used to build links inside emails (password reset). Example: <K>https://dispatch.example.com</K>
        </Field>
        <Field name="CORS_ORIGINS" type="string · csv">
          Comma-separated browser origins allowed to call the API. Only needed when the dashboard is on a different origin than the API; localhost is auto-allowed in development. Example:{" "}
          <K>https://dispatch.example.com</K>
        </Field>
        <Field name="TRUST_PROXY" type="boolean · default off">
          Set <K>true</K> when behind a reverse proxy so rate limiting and logs use the real client IP from <K>X-Forwarded-For</K>.
        </Field>
        <Field name="ALLOW_PRIVATE_WEBHOOKS" type="boolean · default off">
          When unset, the API blocks webhooks pointed at private/internal addresses (an SSRF guard). Set <K>true</K> only if you intentionally fire at services inside your own network.
        </Field>
      </FieldList>

      <FieldList title="dispatch-web/.env.local">
        <Field name="NEXT_PUBLIC_API_URL" type="string · origin" required>
          Public origin the browser uses to reach the API — with the path-routed nginx setup, the same origin as the dashboard. No trailing slash, no <K>/api/v1</K> suffix. Inlined at build time: it must be set before{" "}
          <K>next build</K>, and a change requires a rebuild. Example: <K>https://dispatch.example.com</K>
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
cd dispatch-backend
npm install                 # also runs prisma generate
cp .env.example .env        # point DATABASE_URL at your MySQL, set GMAIL_*
npx prisma migrate dev
npm run dev                 # http://localhost:4000, hot-reloads

# 3 · the dashboard — terminal two
cd dispatch-web
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
      <CodeBlock code={LOCAL_DEV} lang="bash" title="dev setup" className="max-w-3xl" />

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">testing webhooks locally</p>
        <P>
          The question every developer hits first: &quot;my handler runs on my laptop — what do I put in <K>webhookUrl</K>?&quot; It depends on where Dispatch is running:
        </P>
        <P>
          <strong className="font-medium text-zinc-200">Dispatch running locally too?</strong> The scheduler fires from the backend process on your machine, so <K>http://localhost:5000/hooks/test</K> works as a{" "}
          <K>webhookUrl</K> directly — but note that loopback and private addresses are blocked by default, so set <K>ALLOW_PRIVATE_WEBHOOKS=true</K> in your local <K>.env</K> first.
        </P>
        <P>
          <strong className="font-medium text-zinc-200">Dispatch hosted somewhere else?</strong> It can&apos;t reach your localhost — you need a tunnel. ngrok is the standard move (and its public URL passes the SSRF
          guard):
        </P>
        <CodeBlock code={NGROK_SETUP} lang="bash" className="max-w-3xl" />
        <CodeBlock code={NGROK_OUTPUT} lang="text" title="ngrok output" className="max-w-3xl" />
        <CodeBlock code={NGROK_USE} lang="bash" title="schedule against the tunnel" className="max-w-3xl" />
      </div>

      <Callout tone="info" legend="ngrok field notes" className="max-w-3xl">
        <ul className="space-y-1.5">
          <li>On the free plan the forwarding URL changes every restart — jobs scheduled against a dead tunnel will fail and retry into the void. Claim ngrok&apos;s free static domain so the URL survives restarts.</li>
          <li>
            The web interface at <K>http://127.0.0.1:4040</K> shows every delivery ngrok forwarded — request body, your response, timing. It pairs perfectly with the Dispatch delivery log for debugging both sides.
          </li>
          <li>Deliveries that failed while your tunnel was down are retried on the normal 30s → 1m → 5m backoff, so a quick tunnel restart often catches the retry.</li>
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
cd dispatch-backend
npm install
npx prisma migrate deploy   # applies any new migrations; safe to re-run
npm run build

# the dashboard
cd ../dispatch-web
npm install
npm run build

# restart both
pm2 restart api-dispatch dispatch-web`;

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
        The restart is safe for your schedule: on boot the API runs a catch-up sweep that fires any job whose <K>fireAt</K> passed while it was down, then keeps a background sweep running every 15 seconds. Nothing is
        lost in the restart window — though a quiet minute is still the considerate time to do it. Check <K>pm2 logs</K> for the scheduler start line afterwards.
      </P>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ */
/* 09 · Known limitations                                              */
/* ------------------------------------------------------------------ */

const LIMITATIONS: { name: string; body: React.ReactNode }[] = [
  {
    name: "No HMAC signing yet",
    body: (
      <>
        Deliveries are not signed, so your endpoint can&apos;t cryptographically verify the sender. Use an unguessable token in the webhook URL as an interim check — the pattern is in the{" "}
        <a href="/docs/using#code-examples" className="text-amber-400 hover:underline">
          Using Dispatch guide
        </a>
        .
      </>
    ),
  },
  {
    name: "Rate limiting is per-instance",
    body: (
      <>
        The API rate-limits requests using in-process memory. On a single instance that&apos;s exactly right. If you run multiple API replicas, each enforces its own limit — wire in a shared store (e.g. Redis) for a
        global one. Job firing itself is already safe across replicas.
      </>
    ),
  },
  {
    name: "Email is required to sign up",
    body: (
      <>
        Registration sends a verification code, so a working <K>GMAIL_USER</K> / <K>GMAIL_APP_PASSWORD</K> pair must be configured before anyone can create an account. There is no &quot;skip email&quot; mode yet.
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
              <span className="font-mono text-[10px] tracking-wider text-zinc-700">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-sm font-medium text-zinc-100">{item.name}</h3>
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400">{item.body}</p>
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
    <DocsShell crumb="self-hosting" title="Self-hosting Dispatch" lead="Run the whole thing on your own server: install, configure, proxy, keep it alive, and upgrade without losing the schedule." sections={SECTIONS}>
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
            placeholder: "MariaDB already running; domain is dispatch.acme.dev",
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
