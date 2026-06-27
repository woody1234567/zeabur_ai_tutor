# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                    # Start Nuxt dev server (http://localhost:3000)
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Database
pnpm db:generate            # Generate Drizzle migrations from schema changes
pnpm db:migrate             # Apply migrations to the database
pnpm db:studio              # Open Drizzle Studio (database GUI)
docker compose up -d        # Start local PostgreSQL
```

## Architecture Overview

This is a **Nuxt 4 tutoring platform** with integrated AI chat (OpenAI-compatible, server-side).

### Directory Layout

```
app/                        # Nuxt 4 app directory
  pages/                    # File-based routing (admin/, teacher/, student/, parent/)
  components/               # Vue components, namespaced by role (teacher/, student/, etc.)
  layouts/                  # Role-specific layouts (teacher.vue, student.vue, etc.)
  middleware/auth.global.ts # Global role-based route guard
db/
  schema.ts                 # All Drizzle ORM table definitions (single source of truth)
  index.ts                  # createDb() — lazy singleton drizzle client (used by server/utils/db.ts)
server/
  api/                      # API routes mirroring role namespacing (teacher/, student/, etc.)
  utils/                    # Server utilities auto-imported by Nitro
    auth.ts                 # better-auth server instance + requireAuthSession()
    db.ts                   # useDrizzle() — thin wrapper around createDb(), Nitro auto-imported
    r2.ts                   # Two Cloudflare R2 S3 clients
lib/
  auth-client.ts            # better-auth Vue client (signIn, signOut, useSession)
locales/                    # i18n translation files (en.json, zhTW.json)
drizzle/                    # Auto-generated migration files
```

### Authentication & Authorization

- **Library**: better-auth with email/password + Google OAuth + admin plugin
- **Server**: `requireAuthSession(event)` from `server/utils/auth.ts` — throws 401 if unauthenticated
- **Client**: `authClient` from `lib/auth-client.ts` — use `useSession()` in components
- **Route guard**: `app/middleware/auth.global.ts` uses `useRouteBaseName()` to enforce role-based access by route prefix

**Role lifecycle**: New users get role `user` → pick a role at `/role_picking` → request is stored in `roleRequests` table → redirect to `/pending` → admin approves → role assigned.

**Route protection by prefix**: `admin/*` → admin only, `teacher/*` → teacher or admin, `student/*` → student or admin, `parent/*` → parent or admin.

### Database Schema (key tables)

All tables are in `db/schema.ts`:
- **Auth tables**: `user`, `session`, `account`, `verification` (managed by better-auth)
- **Core content**: `problems` (MCQ with jsonb `choices`, `hashtags`, optional `imageUrl`)
- **Classrooms**: `classrooms`, `classroomStudents`
- **Homework system**: `homeworks` → `homeworkProblems` (assignment) → `hwRecords` (student answers) → `homeworkCompletions`
- **Student tracking**: `submissions`, `favorites`, `errorProblems`, `problemsStatus` (unified status with unique `userId+problemId`)
- **Materials**: `classMaterials` (hierarchical, self-referencing `parentId`), `classroomMaterials` (many-to-many sharing)
- **Social**: `posts`, `postsTemplate`
- **Calendar**: `personalEvents`
- **Role flow**: `roleRequests`, `pendingParent`, `parentStudents`
- **AI**: `chatHistory` (jsonb `messages` array)

### i18n

- Two locales: `en` (default, no prefix) and `zhTW` (prefix: `/zhTW/...`)
- Strategy: `prefix_except_default`
- Always use `useLocalePath()` for navigation and `useRouteBaseName()` for route name matching
- Translation files: `locales/en.json`, `locales/zhTW.json`

### File Storage (Cloudflare R2)

Two separate R2 buckets accessed via `server/utils/r2.ts`:
- `r2` — for problem images (`r2BucketName`)
- `classMaterialsR2` — for teacher-uploaded class materials (`classMaterialsR2BucketName`)

### PWA (Progressive Web App)

- **Module**: `@vite-pwa/nuxt` with `generateSW` strategy
- **Update behavior**: `prompt` — shows a DaisyUI toast when a new version is available (`app/components/PwaUpdatePrompt.vue`)
- **Offline**: falls back to `public/offline.html` when offline; API routes (`/api/*`) are excluded from service worker caching
- **Manifest & meta tags**: registered in `app/app.vue` via `<NuxtPwaManifest />` and `useHead()`
- **Icons**: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`, `public/mask-icon.svg`
- **Config**: all PWA options are in the `pwa` key of `nuxt.config.ts`
- **Dev testing**: set `pwa.devOptions.enabled: true` in `nuxt.config.ts` to test PWA in dev mode

### AI Chat

- Integrated into Nuxt server — no separate microservice needed
- `server/utils/ai-chat.ts` — OpenAI SDK streaming chat with tool-call loop (configurable base URL / model via `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`)
- `server/utils/ai-tools/` — TypeScript tool definitions (search-problems, recommend-materials, create-problem, web-search)
- Student chat: `server/api/student/chat.post.ts`; Teacher chat: `server/api/teacher/chat.post.ts`

### Composio External Tools

Teachers and students can connect Gmail, Google Calendar, and Google Drive via OAuth. Connected toolkits are passed as `toolkits: string[]` in the chat request body and merged into `streamText` alongside the built-in tools.

Key files:
- `server/utils/composio.ts` — Composio singleton; `getComposioTools(userId, toolkits)` returns a Vercel AI SDK-compatible `ToolSet`
- `server/api/{teacher,student}/composio/connect.post.ts` — OAuth initiation, returns `redirectUrl`
- `server/api/{teacher,student}/composio/status.get.ts` — returns `{ [slug]: boolean }` for all three toolkits
- `app/components/chat/ComposioPanel.vue` — sidebar UI (connect + per-toolkit toggle), used via `#sidebar-bottom` slot in `ChatView`

Toolkit slugs (confirmed): `gmail`, `googlecalendar`, `googledrive` (no underscore).

Tool I/O in `ai_interaction_logs` is truncated to 64 KB via `serializeInteractionValue` in `server/utils/ai-interaction-logger.ts` — Composio responses can be 40 k+ characters.

### Environment Variables

Required in `.env` or `.env.local` (`.env.local` takes precedence):
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — auth signing secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `OPENAI_API_KEY` — for AI features and teacher tools (vision, generate options)
- `AI_BASE_URL` — OpenAI-compatible base URL (default: `https://api.openai.com/v1`)
- `AI_API_KEY` — API key for AI chat (falls back to `OPENAI_API_KEY`)
- `AI_MODEL` — chat model name (default: `gpt-4o`)
- `GOOGLE_VISION_API_KEY` — for teacher's image-to-problem OCR tool
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN`
- `CLASS_MATERIALS_R2_*` — same set for the class materials bucket
- `NUXT_PUBLIC_BASE_URL` — app base URL (used by auth server, auth client SSR, email templates)
- `COMPOSIO_API_KEY` — Composio API key (from dashboard.composio.dev/settings); required for Gmail/Calendar/Drive integration
