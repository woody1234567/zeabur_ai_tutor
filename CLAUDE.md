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

# AI microservice (separate process)
cd packages/ai-service && uv run uvicorn src.main:app --reload --port 8000
```

## Architecture Overview

This is a **Nuxt 4 tutoring platform** with a separate **Python FastAPI AI microservice**.

### Directory Layout

```
app/                        # Nuxt 4 app directory
  pages/                    # File-based routing (admin/, teacher/, student/, parent/)
  components/               # Vue components, namespaced by role (teacher/, student/, etc.)
  layouts/                  # Role-specific layouts (teacher.vue, student.vue, etc.)
  middleware/auth.global.ts # Global role-based route guard
db/
  schema.ts                 # All Drizzle ORM table definitions (single source of truth)
  index.ts                  # Drizzle db instance (server-only, uses useRuntimeConfig())
server/
  api/                      # API routes mirroring role namespacing (teacher/, student/, etc.)
  utils/                    # Server utilities auto-imported by Nitro
    auth.ts                 # better-auth server instance + requireAuthSession()
    r2.ts                   # Two Cloudflare R2 S3 clients
lib/
  auth-client.ts            # better-auth Vue client (signIn, signOut, useSession)
packages/ai-service/        # Python FastAPI + LangGraph AI microservice
  src/main.py               # FastAPI entrypoint, /chat endpoint
  src/graph/                # LangGraph workflow (state, nodes, workflow)
  src/tools/                # MCP tool integration
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

### AI Microservice

- Runs independently on port 8000 (Python FastAPI + LangGraph)
- Nuxt calls it via `server/api/student/chat.post.ts` → HTTP POST to `http://localhost:8000/chat`
- LangGraph workflow: `packages/ai-service/src/graph/workflow.py`
- Managed with `uv` (Python package manager); uses MCP tool integration

### Environment Variables

Required in `.env` or `.env.local` (`.env.local` takes precedence):
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — auth signing secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `OPENAI_API_KEY` — for AI features and teacher tools (vision, generate options)
- `GOOGLE_VISION_API_KEY` — for teacher's image-to-problem OCR tool
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN`
- `CLASS_MATERIALS_R2_*` — same set for the class materials bucket
- `PUBLIC_BASE_URL` — used by auth-client SSR fallback
