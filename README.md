# Majburiy Tarix — Telegram Mini App

Telegram bot + Mini App for an online History course: topic tests (Mavzulashtirilgan Testlar), attendance (Davomat), and weekly exams (Imtihon), with a role-gated admin panel built into the same Mini App.

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS, using the official Telegram Web App JS SDK (`telegram-web-app.js`)
- **Backend**: Node.js + Express + grammy (Telegram bot)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Telegram Mini App `initData` validation (no separate login, no JWT/sessions)

## Repository layout

```
backend/    Express API + Telegram bot (single Node process)
frontend/   Vite React Mini App (student + teacher screens)
docker-compose.yml   Postgres (+ backend, for prod-style runs)
.env.example
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres) — or a native PostgreSQL 16 instance
- An [ngrok](https://ngrok.com) account (or any HTTPS tunnel) — Telegram Mini Apps **require HTTPS**, even in development
- A Telegram account to talk to [@BotFather](https://t.me/BotFather)

## Installation (local development)

### 1. Create your bot with BotFather

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → follow the prompts → copy the **bot token**.
2. Keep this chat open — you'll set the Mini App menu button URL here once your tunnel is running (step 5).
3. Get your own numeric Telegram user ID from [@userinfobot](https://t.me/userinfobot) if you want your real account to have teacher access later.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:
- `BOT_TOKEN` — from BotFather.
- `ADMIN_TELEGRAM_IDS` — defaults to `999999`, which matches the frontend's built-in "Test Ustoz" dev identity, so the teacher role works immediately in browser testing. Add your real numeric ID (comma-separated) when you're ready to test as a teacher inside real Telegram.
- `WEBAPP_URL` — fill in once you have your ngrok URL (step 5); leave the placeholder until then.
- Everything else has a sensible local-dev default.

### 3. Start Postgres

```bash
docker compose up -d postgres
```

(Or point `DATABASE_URL` in `.env` at any existing local Postgres 16 instance.)

### 4. Run the backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

This starts the API on `:3000`, the bot in long-polling mode, and the attendance auto-close poller. With `ALLOW_DEV_AUTH=true` (the default), the API also accepts a dev-only auth bypass so the app can be tested from a plain browser — see "Local testing without Telegram" below.

Optional: seed one sample published test —

```bash
npm run prisma:seed
```

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the Mini App on `:5173` and proxies `/api` to the backend on `:3000`.

### 6. Local testing without opening real Telegram

The app can be exercised directly in a normal browser: open `http://localhost:5173`. Since you're not inside the real Telegram client, an amber "DEV" banner appears at the top letting you switch between a **Test Talaba** (student) and **Test Ustoz** (teacher) identity — this drives every screen, including the whole admin panel, without needing a real bot session. This bypass is wired in only when `NODE_ENV !== production` and `ALLOW_DEV_AUTH=true`, and cannot be enabled in the production Docker image regardless of `.env` contents.

### 7. Testing inside real Telegram (HTTPS tunnel)

Real HMAC signature validation, the bot's `/start` button, and the actual Telegram UI chrome can only be verified inside the real client:

1. Point ngrok at the frontend dev server:
   ```bash
   ngrok http 5173
   ```
   A reserved/static ngrok domain (`ngrok config add-authtoken ...`, then `ngrok http --domain=<your-static-domain>.ngrok-free.app 5173`) avoids having to update BotFather every time you restart the tunnel.
2. Copy the `https://...ngrok-free.app` URL into `.env` as `WEBAPP_URL`, and restart the backend so the bot picks it up.
3. In BotFather: `/mybots` → your bot → **Bot Settings → Menu Button** → set the same HTTPS URL (this makes the Mini App reachable from the persistent menu button, in addition to the `/start` inline button the bot sends).
4. Open your bot in Telegram and send `/start`.

## Promoting a Telegram account to teacher

Add the account's numeric Telegram ID to `ADMIN_TELEGRAM_IDS` in `.env` (comma-separated) and restart the backend. Role is re-derived from this list on every request — no database edit and no frontend redeploy needed.

## Known limitations (by design, for this scope)

- There's no separate enrollment/cohort concept: every Telegram user who has ever pressed `/start` counts as a roster member for attendance "absent" calculations.
- `initData` freshness is checked against a 24-hour window; a Mini App left open across that boundary needs to be relaunched (Telegram re-supplies fresh `initData` on each open).

## Deployment

### Architecture: one deployable service

`backend/Dockerfile` is a multi-stage build that compiles **both** apps and bakes the frontend's static build into the backend image (`frontend/dist` → `/app/public`). In production, `app.ts` serves those static files itself and falls back to `index.html` for client-side routes, so the whole Mini App — API, bot webhook, and frontend — runs as **one process on one origin**. This means:

- No CORS configuration needed in production (same origin).
- No separate static host (Vercel/Netlify) needed — one service does everything.
- The frontend has **no `.env.production` of its own** — it's fully static and talks to `/api/*` as a relative path. Only the backend needs production environment variables (see `backend/.env.production.example`).

The Docker **build context is the repo root**, not `backend/` — this matters when configuring any platform's dashboard (below).

### Option A — Railway (recommended: easiest, fastest to a live URL)

1. Push this repo to GitHub (Railway deploys from a GitHub repo).
2. On [railway.app](https://railway.app): **New Project → Deploy from GitHub repo** → pick this repo.
3. Add a Postgres database: **New → Database → Add PostgreSQL**. Railway provisions it and exposes a `DATABASE_URL`-style variable you can reference.
4. Configure the backend service:
   - **Settings → Build**: set **Root Directory** to `/` (repo root) and **Dockerfile Path** to `backend/Dockerfile` (Railway auto-detects the Dockerfile if you leave root at `/`, but pointing at it explicitly avoids ambiguity since `frontend/` also has its own tooling).
   - **Variables**: add everything from `backend/.env.production.example`, using Railway's Postgres reference (e.g. `${{Postgres.DATABASE_URL}}`) for `DATABASE_URL` instead of typing it manually. Leave `PORT` unset — Railway injects its own and the app already reads `process.env.PORT`.
5. **Settings → Networking → Generate Domain** — gives you a public HTTPS URL immediately (e.g. `tarix-backend-production.up.railway.app`). Set `WEBAPP_URL` and `WEBHOOK_URL` to this exact URL (including `https://`).
6. Redeploy (Railway does this automatically after you save variables). Check **Deployments → Logs** for `API listening on port ...` and `Bot webhook registered at ...`.
7. Run the initial migration against the production database. Easiest path: **Settings → open a Shell** on the deployed service (or run once locally with `DATABASE_URL` pointed at Railway's Postgres via its public connection string) and run:
   ```bash
   npx prisma migrate deploy
   ```
8. In BotFather: `/mybots` → your bot → **Bot Settings → Menu Button** → set the same HTTPS URL from step 5.
9. Open the bot in Telegram and send `/start` — the Mini App should open, and the webhook should already be live (no manual `setWebhook` call — see "Configuring the webhook" below).

Cost note: Railway's free trial credit runs out; a small hobby project like this typically costs a few dollars/month once you're on a paid plan (backend service + Postgres).

### Option B — Render (near-identical alternative)

Same single-image architecture, different dashboard:

1. **New → Web Service** → connect the GitHub repo → **Runtime: Docker**.
2. **Root Directory**: leave blank (repo root). **Dockerfile Path**: `backend/Dockerfile`.
3. **New → PostgreSQL** to provision a managed database; copy its **Internal Database URL**.
4. In the Web Service's **Environment** tab, add everything from `backend/.env.production.example`, pasting the Postgres Internal Database URL as `DATABASE_URL`. Render sets `PORT` automatically.
5. Render gives you a `https://<service>.onrender.com` URL on first deploy — use it for `WEBAPP_URL` and `WEBHOOK_URL`.
6. Run `npx prisma migrate deploy` once via Render's **Shell** tab (under the service) against the same database.
7. Same BotFather menu-button step as Railway above.

Caveat: Render's free tier spins the service down after inactivity, which delays the very first webhook delivery after idle periods (Telegram retries, so it's not a hard failure, just a slow first reply). A paid instance avoids this — worth it once you have real users.

### Option C — VPS (DigitalOcean / Hetzner), Docker Compose + Nginx

Full control, cheapest at scale, but you own OS updates, TLS renewal, and uptime.

1. Provision a small VPS (1 vCPU / 1–2 GB RAM is plenty for this scale) and point a domain's DNS `A` record at it.
2. Install Docker + Docker Compose on the server, clone this repo.
3. Copy `backend/.env.production.example` to `.env` in the repo root and fill in real values (`BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `WEBAPP_URL`/`WEBHOOK_URL` = your domain, a strong `POSTGRES_PASSWORD`, `NODE_ENV=production`).
4. `docker compose up -d --build` — builds the unified image (frontend + backend) and starts it alongside Postgres.
5. Install Nginx + certbot on the host; reverse-proxy `your-domain.com` → `http://127.0.0.1:3000` (the one backend container now serves everything: static frontend, `/api/*`, and `/bot/webhook`). Run `certbot --nginx` for a free Let's Encrypt certificate — Telegram refuses to open a non-HTTPS Mini App URL.
6. Run migrations: `docker compose exec backend npx prisma migrate deploy`.
7. Same BotFather menu-button step as above, pointing at `https://your-domain.com`.

### Option D — VPS without Docker (bare Node, no containers)

- Backend: `npm run build` inside `backend/`, then run under PM2 (`pm2 start dist/index.js --name tarix-backend`), pointed at a managed or locally-installed Postgres. You'll need to build the frontend (`cd frontend && npm run build`) and either copy `frontend/dist` into `backend/public` yourself (matching what the Dockerfile does) or serve it directly via Nginx alongside a reverse proxy to the backend for `/api` and `/bot/webhook`.
- Same TLS, webhook, and BotFather steps as Option C.

### Configuring the Telegram webhook

No manual `setWebhook` call is needed — it's automatic and idempotent:

- On every startup, if `NODE_ENV=production` **and** `WEBHOOK_URL` is set, `index.ts` calls `bot.api.setWebhook(`${WEBHOOK_URL}/bot/webhook`)` and `app.ts` mounts the matching `POST /bot/webhook` route. Restarting the service re-registers the same webhook — harmless.
- If either `NODE_ENV=production` or `WEBHOOK_URL` is missing, it falls back to long-polling (`bot.start()`) instead — useful if you ever want to run the production image without a public webhook URL temporarily.
- To confirm it's actually registered, call `https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo` in a browser — `url` should match `<WEBHOOK_URL>/bot/webhook` and `last_error_message` should be empty (a non-empty error here usually means the URL isn't reachable/HTTPS yet, or the deploy hasn't picked up the env vars).
- `WEBAPP_URL` (the `/start` inline button) and the BotFather **Menu Button** URL (step in every option above) are separate settings from the webhook — both should point at the same public HTTPS domain, but neither one *is* the webhook registration.
- If you ever change domains, just update `WEBHOOK_URL`/`WEBAPP_URL` and redeploy; there's nothing to manually unregister first (Telegram simply overwrites the previous webhook URL).

## Verification checklist

- [ ] `docker compose up -d postgres` succeeds and the container is healthy
- [ ] `npx prisma migrate dev` applies cleanly
- [ ] Backend `npm run dev` logs "API listening" and "Bot started in long-polling mode"
- [ ] Frontend loads at `localhost:5173` with the DEV identity switcher visible
- [ ] Student flow: pick a period → take a test → see scored result → see it reflected on the dashboard
- [ ] Teacher flow: create a test with questions → publish it → switch to student identity → confirm it's takeable
- [ ] Attendance: start a session as teacher → mark as student → confirm a second mark attempt is rejected → confirm it auto-closes after the configured duration
- [ ] Exam: create + publish an exam with a timer → take it as student → confirm PASSED/FAILED at the 50% threshold
- [ ] Inside real Telegram: `/start` opens the Mini App via the `web_app` button, and the menu button (once configured in BotFather) also opens it
