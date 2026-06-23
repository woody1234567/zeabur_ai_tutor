# zeabur_ai_tutor_may

AI Tutor platform built with **Nuxt 4 + PostgreSQL (Drizzle) + better-auth + Cloudflare R2**. Streaming tutor chat and tool execution run directly in the Nuxt server through **AI SDK 6**.

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
- Unified AI interaction logging for user messages, assistant responses, and tool calls
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
- AI SDK 6
- TailwindCSS + DaisyUI
- @nuxtjs/i18n (en / zhTW)

### Backend services
- PostgreSQL
- Drizzle ORM + drizzle-kit
- better-auth
- Cloudflare R2 (S3-compatible)

### AI service (`packages/ai-service`) — **Legacy**
> This microservice is no longer actively used. AI features are now handled directly by the Nuxt server.

---

## Repository Structure

```text
app/                    # Nuxt app (pages/components/layouts/middleware)
server/                 # API routes, utils, MCP tools/resources
db/                     # Drizzle schema and DB client
drizzle/                # Generated migrations and snapshots
packages/ai-service/    # (Legacy) Python FastAPI + LangGraph AI microservice
i18n/locales/           # Translation files (en.json, zhTW.json)
```

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)

---

## Environment Variables

Create `.env.local` (recommended) or `.env` in repo root.

### Core
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `NUXT_PUBLIC_BASE_URL` (default: `http://localhost:3000`)

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

1. The student or teacher frontend calls `POST /api/student/chat` or `POST /api/teacher/chat`.
2. The Nuxt server route validates the session and records the latest user message.
3. `server/utils/ai-chat.ts` creates an AI SDK `streamText()` response with the available tools.
4. Completed tool executions are recorded through `experimental_onToolCallFinish`.
5. When the stream finishes, the assistant response and chat history are persisted.
6. Tool parts in the final UI message are reconciled as a fallback in case the direct callback did not write a record.

---

## AI Interaction Logging

All current AI activity is stored in the `ai_interaction_logs` table. One table is used for these event types:

- `user_message`: a message submitted by a student or teacher
- `assistant_message`: a completed, aborted, or failed assistant response
- `tool_call`: a completed or failed AI tool execution, including its input and output

### Write flow

```text
Student / Teacher chat API
  ├─ user and assistant messages
  │    → server/utils/ai-chat-interactions.ts
  │    → server/utils/ai-interaction-logger.ts
  │    → ai_interaction_logs
  │
  └─ completed tool execution
       → server/utils/ai-tool-recorder.ts
       → server/utils/ai-interaction-logger.ts
       → ai_interaction_logs
```

The files have the following responsibilities:

- `server/utils/ai-chat-interactions.ts` converts AI SDK `UIMessage` data into user-message, assistant-message, and fallback tool-call log entries.
- `server/utils/ai-tool-recorder.ts` receives AI SDK `OnToolCallFinishEvent` callbacks and records tool name, input, output, SDK-provided execution duration, step number, model ID, and errors.
- `server/utils/ai-interaction-logger.ts` is the only shared database writer. It normalizes values and inserts or updates `ai_interaction_logs`.
- `server/api/admin/ai-interaction-logs.get.ts` is the admin-only read API used by the log viewer.

Assistant response duration is measured on the server from immediately before stream creation until the stream finishes or fails. This end-to-end duration includes model setup, model generation, streaming, and any tool calls. User message events do not have a duration.

### Tool-call fallback and deduplication

Tool calls have two recording paths:

1. The primary path is `experimental_onToolCallFinish`, handled by `ai-tool-recorder.ts`.
2. After the response stream finishes, `reconcileToolCallsFromMessage()` checks completed tool parts in the final `UIMessage` and writes any missing records.

Both paths use the same unique event key:

```text
tool:<chatId>:<toolCallId>
```

The fallback uses an ignore-on-conflict insert. This prevents duplicate rows and preserves the richer callback record when it already exists. Message events use similarly stable keys based on chat ID, role, and message ID.

### Failure behavior

Logging failures are reported to the server console and return `false` from the shared logger. They do not terminate the active AI chat stream. Callers that require stronger delivery guarantees should explicitly handle the returned result.

### Admin log viewer

- Page: `/admin/ai-interaction-logs`
- API: `GET /api/admin/ai-interaction-logs`
- Access: admin only

The API supports search, event type, tool name, user role, status, chat ID, date, and pagination filters. It joins the `user` table to include the user name in the response.

### Database migrations

The unified table is defined in `db/schema.ts`. After changing its schema, generate and apply a migration:

```bash
pnpm db:generate
pnpm db:migrate
```

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
