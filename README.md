# zeabur_ai_tutor_may

AI Tutor platform built with **Nuxt 4 + PostgreSQL (Drizzle) + better-auth + Cloudflare R2**, with a separate **Python FastAPI AI service** for streaming tutor chat.

---

## Features

- Multi-role product surfaces: **admin / teacher / student / parent**
- Authentication with **better-auth** (email/password + Google OAuth)
- Role request/approval flow
- Teacher workflows:
  - problem bank CRUD
  - classroom & student management
  - homework assignment
  - class materials upload/share (R2)
- Student workflows:
  - problems, homework, favorites, wrong-problem tracking
  - AI tutor chat (streaming SSE)
- Parent/admin workflows:
  - parent-student linking
  - pending approvals & user management
- Built-in MCP tools/resources used by AI service

---

## Tech Stack

### Web app
- Nuxt 4
- Vue 3
- Nitro server routes
- TailwindCSS + DaisyUI
- @nuxtjs/i18n (en / zhTW)

### Backend services
- PostgreSQL
- Drizzle ORM + drizzle-kit
- better-auth
- Cloudflare R2 (S3-compatible)

### AI service (`packages/ai-service`)
- FastAPI
- LangGraph + LangChain
- OpenAI
- MCP adapters (`langchain-mcp-adapters`)

---

## Repository Structure

```text
app/                    # Nuxt app (pages/components/layouts/middleware)
server/                 # API routes, utils, MCP tools/resources
db/                     # Drizzle schema and DB client
drizzle/                # Generated migrations and snapshots
packages/ai-service/    # Python FastAPI + LangGraph AI microservice
i18n/locales/           # Translation files (en.json, zhTW.json)
```

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)
- Python 3.10+ and `uv` (for AI service)

---

## Environment Variables

Create `.env.local` (recommended) or `.env` in repo root.

### Core
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `NUXT_BASE_URL` (optional)
- `BETTER_AUTH_URL` (default: `http://localhost:3000`)

### OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### AI
- `OPENAI_API_KEY`
- `GOOGLE_VISION_API_KEY` (used by teacher vision feature)

### Cloudflare R2 (problem images)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_DOMAIN`

### Cloudflare R2 (class materials)
- `CLASS_MATERIALS_R2_ACCOUNT_ID`
- `CLASS_MATERIALS_R2_ACCESS_KEY_ID`
- `CLASS_MATERIALS_R2_SECRET_ACCESS_KEY`
- `CLASS_MATERIALS_R2_BUCKET_NAME`
- `CLASS_MATERIALS_R2_PUBLIC_DOMAIN`

> `nuxt.config.ts` loads `.env` first, then `.env.local` with override.

---

## Local Development

### 1) Install dependencies

```bash
pnpm install
```

### 2) Start PostgreSQL

```bash
docker compose up -d
```

### 3) Run migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 4) Start Nuxt app

```bash
pnpm dev
```

Nuxt runs at: <http://localhost:3000>

### 5) Start AI service (separate terminal)

```bash
cd packages/ai-service
uv run uvicorn src.main:app --reload --port 8000
```

AI service runs at: <http://localhost:8000>

---

## Available Scripts

```bash
pnpm dev          # Start Nuxt dev server
pnpm build        # Build app
pnpm preview      # Preview production build
pnpm start        # Start built server

pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply migrations
pnpm db:studio    # Open Drizzle Studio
```

---

## Auth & Role Access Model

- Route-level access is enforced in `app/middleware/auth.global.ts`
- Prefix rules:
  - `/admin/*` → admin only
  - `/teacher/*` → teacher or admin
  - `/student/*` → student or admin
  - `/parent/*` → parent or admin
- New users with role `user` are redirected through role-picking / pending approval flow

---

## AI Chat Flow (High-level)

1. Frontend calls `POST /api/student/chat`
2. Nuxt route validates session, loads prior chat history
3. Nuxt route streams to Python `POST /chat/stream`
4. Python LangGraph agent uses MCP tools (served by Nuxt `/mcp`)
5. Streamed tokens are forwarded back to frontend
6. Final assistant message is persisted into `chat_history`

---

## Notes for Contributors

- DB schema source of truth: `db/schema.ts`
- If schema changes:
  1. update schema
  2. `pnpm db:generate`
  3. `pnpm db:migrate`
- Keep role boundaries explicit in API routes
- Keep MCP tool contract (`server/mcp/**`) synchronized with AI-service tool usage

---

## License

No license file is currently defined in this repository.
