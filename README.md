# Dispatch

Open-source webhook scheduling for developers. POST a job with a URL and a time — Dispatch fires the webhook at exactly that moment.

No cron jobs. No in-memory timers dying on server restarts. No polling delays.

---

## How it works

1. Create a project and grab an API key from the dashboard
2. POST a job to the Dispatch API
3. Dispatch fires your webhook at the scheduled time — you handle the logic

```bash
curl -X POST https://your-dispatch-instance.com/api/v1/jobs \
  -H "x-api-key: sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Send invoice email",
    "webhookUrl": "https://myapp.com/webhooks/invoice",
    "fireAt": "2026-06-15T10:00:00Z",
    "payload": { "invoiceId": 123 }
  }'
```

---

## Features

- **Fires on time** — jobs are scheduled in memory, no polling lag
- **Auto-retry** — exponential backoff on failure (30s → 1m → 5m), marks dead after 3 attempts
- **Full logs** — every attempt, every response code, stored per job
- **Multi-project** — separate projects with separate API keys
- **No SDK required** — plain HTTP, works with any language or framework
- **Self-hostable** — one `docker-compose up` and it's yours

---

## Self-hosting

### Prerequisites
- Docker + Docker Compose
- A MySQL database

### Quick start

```bash
git clone https://github.com/imtiyazsayyid/dispatch
cd dispatch
cp dispatch-backend/.env.example dispatch-backend/.env
cp dispatch-web/.env.example dispatch-web/.env
# Fill in your DATABASE_URL and other env vars
docker-compose up
```

The API will be available at `http://localhost:4000` and the dashboard at `http://localhost:3000`.

---

## API Reference

All job endpoints authenticate via the `x-api-key` header.

### Schedule a job

```
POST /api/v1/jobs
x-api-key: sk_your_key
```

```json
{
  "title": "string",
  "webhookUrl": "https://your-app.com/webhook",
  "fireAt": "2026-06-15T10:00:00Z",
  "payload": {}
}
```

### Cancel a job

```
DELETE /api/v1/jobs/:id
x-api-key: sk_your_key
```

---

## Development

### Backend

```bash
cd dispatch-backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd dispatch-web
npm install
npm run dev
```

---

## Stack

- **Backend** — Node.js, Express, TypeScript, Prisma, MySQL
- **Frontend** — Next.js 16, Tailwind CSS, shadcn/ui, Framer Motion
- **Scheduling** — RAM-based with DB persistence and rehydration on restart

---

## License

MIT © [Imtiyaz Sayyid](https://github.com/imtiyazsayyid)
