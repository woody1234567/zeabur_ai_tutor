# zeabur_ai_tutor_may — Codebase Summary

## 1) Project positioning
- This is a **Nuxt 4 full-stack tutoring platform** with role-based product surfaces:
  - `admin`
  - `teacher`
  - `student`
  - `parent`
- It also includes a separate **Python FastAPI AI service** (`packages/ai-service`) that provides chat streaming and LangGraph+MCP-based tool use.

## 2) Tech stack
- Frontend/Server: **Nuxt 4**, Vue 3, Nitro server APIs
- Auth: **better-auth** (+ Google OAuth + admin plugin)
- DB ORM: **Drizzle ORM** (PostgreSQL)
- Storage: **Cloudflare R2** (S3 compatible), 2 buckets
- i18n: `@nuxtjs/i18n` (English default + Traditional Chinese)
- AI:
  - Nuxt API layer for tutor features
  - FastAPI microservice + LangGraph + MCP adapters
  - OpenAI SDK used in several server routes

## 3) Repository structure (high level)
- `app/`
  - `pages/`: route-based pages by role
  - `components/`: shared + role-specific UI components
  - `layouts/`: role layouts (`admin.vue`, `teacher.vue`, etc.)
  - `middleware/auth.global.ts`: global auth/role route guard
- `server/`
  - `api/`: all backend HTTP endpoints by role/domain
  - `utils/`: auth/db/r2/material/problem helper utilities
  - `mcp/`: MCP tools + resources exposed by Nuxt side
- `db/`
  - `schema.ts`: all DB tables (single source of truth)
  - `index.ts`: drizzle client wiring
- `packages/ai-service/`
  - `src/main.py`: FastAPI entry
  - `src/graph/`: LangGraph workflow
  - `src/tools/`: MCP manager/client integration
- `drizzle/`: generated migration metadata/sql
- `i18n/locales/`: `en.json`, `zhTW.json`

## 4) Product domains implemented
### A. Authentication / Role flow
- Session and auth tables exist (`user`, `session`, `account`, `verification`).
- Users appear to start as role `user` and then request/choose role.
- Middleware enforces route-level role access by route base name.

### B. Teacher workflows
- Problem bank CRUD (`/api/teacher/problems/*`)
- Classroom CRUD + student assignment (`/api/teacher/classrooms/*`)
- Homework creation and assignment (`/api/teacher/homeworks/*`)
- Class post and post-template operations
- Material management (upload/folder/share), backed by R2
- Extra AI helpers (`vision`, format content, generate options)

### C. Student workflows
- Browse classrooms/homeworks/materials/problems
- Submit answers and track status
- Favorites + wrong problems + understood flags
- AI tutor chat (streaming), with chat history persisted

### D. Parent/Admin workflows
- Parent-student linking and pending flow
- Admin user search/role support/pending parent approvals

## 5) Database model understanding
Main table groups in `db/schema.ts`:
- Auth: `user`, `session`, `account`, `verification`
- Learning core: `problems`, `submissions`, `problemsStatus`, `favorites`, `errorProblems`
- Classroom: `classrooms`, `classroomStudents`
- Homework: `homeworks`, `homeworkClassrooms`, `homeworkProblems`, `hwRecords`, `homeworkCompletions`
- Content/materials: `classMaterials` (folder-like hierarchy with `parentId`), `classroomMaterials`
- Communication/social: `posts`, `postsTemplate`
- Role/admin: `roleRequests`, `pendingParent`, `parentStudents`
- Calendar: `personalEvents`
- AI memory/history: `chatHistory`

## 6) AI architecture understanding
### Nuxt side
- Student chat endpoint: `server/api/student/chat.post.ts`
  - Auth check
  - Loads prior conversation from `chatHistory`
  - Opens SSE stream to Python service: `POST http://localhost:8000/chat/stream`
  - Forwards token stream to frontend
  - On stream completion persists new chat transcript in DB

### Python side (`packages/ai-service`)
- FastAPI exposes `/chat/stream` (SSE) and `/chat` (sync compatibility)
- LangGraph uses `create_react_agent` with OpenAI model and MCP tools
- MCP manager connects to Nuxt MCP endpoint (`http://localhost:3000/mcp`) and loads tools

### MCP tools currently visible on Nuxt side
- `search_problems`
- `recommend_materials`
- plus MCP resources for list-style data access

## 7) Environment/config expectations
Important runtime envs from `nuxt.config.ts` + auth/r2 usage:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `R2_*` and `CLASS_MATERIALS_R2_*` family

## 8) Notable observations / potential risks
1. `README.md` is still Nuxt template-level and not project-specific yet.
2. `auth.global.ts` has debug logs and MCP-bypass comment is commented out; if MCP route handling is needed, this should be reviewed.
3. `packages/ai-service/src/graph/nodes.py` contains mock/legacy-looking node functions that may not be part of current main path (current stream path goes via `workflow.py`).
4. Repo currently includes Python `__pycache__` files under `packages/ai-service/src/`; usually should be gitignored.
5. `search_problems.ts` imports `db`, `problems`, `and`, `ilike`, `sql` but delegates logic to utility; some imports may be unused.

## 9) Quick operational map
- Start DB: `docker compose up -d`
- Nuxt dev: `pnpm dev`
- AI service dev: `cd packages/ai-service && uv run uvicorn src.main:app --reload --port 8000`
- Migrations: `pnpm db:generate && pnpm db:migrate`

## 10) Suggested next steps (for maintainability)
- Replace README with real project onboarding docs (architecture + env + local run order).
- Add/verify `.gitignore` for Python cache artifacts.
- Create a short API inventory doc by role (student/teacher/admin/parent).
- Clarify which AI graph files are production path vs legacy/mock.
- Add minimal smoke tests for critical endpoints (auth, chat, problem CRUD).

---
This summary is based on repository-wide structure review and key implementation file inspection.
