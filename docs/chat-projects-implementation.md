# Chat Projects Feature Implementation

Inspired by ChatGPT Projects. Allows students and teachers to organize AI chats into projects, each with a custom system prompt that augments the AI's behavior.

## Design Decisions

- **Unified `chat_projects` table** with a `role` discriminator (`student` | `teacher`) instead of duplicating tables per role. Access control enforced at the API layer.
- **Shared utility pattern** — all project business logic in `server/utils/chat-projects.ts`; route handlers are thin auth wrappers (~5-10 lines each). Avoids the duplication problem of the existing student/teacher chat routes.
- **Append, not replace** — custom system prompts are appended after the base role prompt (`--- Project Instructions ---` separator), preserving tool instructions and role context.
- **`onDelete: "set null"`** on the `projectId` FK — deleting a project moves its chats to "unorganized" instead of deleting them.
- **No data migration needed** — existing chats get `projectId = NULL` automatically (shown under "Unorganized" section).

## New Files Created

### Database

| File | Description |
|------|-------------|
| `drizzle/0004_wise_electro.sql` | Migration: creates `chat_projects` table, adds `project_id` column to both chat tables |

### Backend

| File | Description |
|------|-------------|
| `server/utils/chat-projects.ts` | Shared utility with `listProjects`, `createProject`, `updateProject`, `deleteProject`, `moveChatToProject`, `listChats` |
| `server/api/student/projects/index.get.ts` | List student projects |
| `server/api/student/projects/index.post.ts` | Create student project |
| `server/api/student/projects/[id].put.ts` | Update student project |
| `server/api/student/projects/[id].delete.ts` | Delete student project |
| `server/api/student/chats/[id]/project.put.ts` | Move student chat between projects |
| `server/api/teacher/projects/index.get.ts` | List teacher projects |
| `server/api/teacher/projects/index.post.ts` | Create teacher project |
| `server/api/teacher/projects/[id].put.ts` | Update teacher project |
| `server/api/teacher/projects/[id].delete.ts` | Delete teacher project |
| `server/api/teacher/chats/[id]/project.put.ts` | Move teacher chat between projects |

### Frontend

| File | Description |
|------|-------------|
| `app/components/chat/ProjectSidebar.vue` | Shared sidebar with expandable project groups, unorganized section, and project action menus |
| `app/components/chat/ProjectDialog.vue` | Create/edit project modal (name, description, system prompt with 2000-char limit) |
| `app/components/chat/MoveChatDialog.vue` | Move chat between projects dialog |

## Modified Files

### Database Schema

| File | Change |
|------|--------|
| `db/schema.ts` | Added `chatProjects` table definition; added `projectId` FK column to `chatHistory` and `teacherChatHistory` |

### Backend

| File | Change |
|------|--------|
| `server/utils/ai-chat.ts` | Added `projectId` to `StreamChatOptions`; appends project system prompt after base role prompt |
| `server/api/student/chat.post.ts` | Accepts `projectId` in body, passes to `streamChat()`, stores on new chats |
| `server/api/teacher/chat.post.ts` | Same as above (teacher variant with image support preserved) |
| `server/api/student/chats/index.get.ts` | Refactored to use shared `listChats()` utility; returns `projectId`; supports `?projectId` and `?unorganized` query filters |
| `server/api/teacher/chats/index.get.ts` | Same refactor as student variant |

### Frontend

| File | Change |
|------|--------|
| `app/pages/student/ai-chat.vue` | Replaced inline sidebar with `<ChatProjectSidebar>`; added project state management, CRUD handlers, project indicator bar |
| `app/pages/teacher/ai-chat.vue` | Same refactor as student (image upload functionality preserved) |

### i18n

| File | Change |
|------|--------|
| `i18n/locales/en.json` | Added top-level `chat` key with project-related strings (23 keys) |
| `i18n/locales/zhTW.json` | Same keys in Traditional Chinese |

## Database Schema

```sql
-- New table
CREATE TABLE "chat_projects" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "role" text NOT NULL,            -- "student" | "teacher"
  "name" text NOT NULL,
  "description" text,              -- user-facing notes, NOT sent to AI
  "system_prompt" text,            -- appended to base role prompt
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Added to chat_history and teacher_chat_history
ALTER TABLE "chat_history" ADD COLUMN "project_id" text
  REFERENCES "chat_projects"("id") ON DELETE SET NULL;
ALTER TABLE "teacher_chat_history" ADD COLUMN "project_id" text
  REFERENCES "chat_projects"("id") ON DELETE SET NULL;
```

## API Routes

### Project CRUD (shared utility, role-specific wrappers)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/{role}/projects` | List user's projects |
| POST | `/api/{role}/projects` | Create project `{ name, description?, systemPrompt? }` |
| PUT | `/api/{role}/projects/:id` | Update project |
| DELETE | `/api/{role}/projects/:id` | Delete project (chats become unorganized) |
| PUT | `/api/{role}/chats/:id/project` | Move chat `{ projectId: string \| null }` |

### Modified chat routes

| Method | Route | Change |
|--------|-------|--------|
| GET | `/api/{role}/chats` | Now returns `projectId`; accepts `?projectId=xxx` or `?unorganized=true` |
| POST | `/api/{role}/chat` | Accepts `projectId` in body; stores on new chats; passes to `streamChat()` |

## System Prompt Flow

```
Base role prompt (hardcoded in ai-chat.ts)
  ↓
+ Project custom instructions (if projectId provided)
  ↓
Sent as system message to OpenAI API
```

The project system prompt is fetched from DB on each chat message and appended with a `--- Project Instructions ---` separator. Character limit: 2000 chars (enforced in `chat-projects.ts`).

## Deployment Notes

1. Run `pnpm db:migrate` to apply the migration (`0004_wise_electro.sql`)
2. No data migration needed — existing chats have `project_id = NULL` (shown as "Unorganized")
3. Build verified: `pnpm build` passes with no errors
