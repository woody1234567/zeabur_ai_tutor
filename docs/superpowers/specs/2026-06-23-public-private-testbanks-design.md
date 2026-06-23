# Public/Private Testbanks Design

## Overview

Add a testbank system so teachers can organize problems into named collections (public or private), share private testbanks with specific classrooms, and let students access problems based on visibility rules.

## Requirements

- Teachers can create multiple named testbanks (public or private)
- Public testbank problems are visible to all authenticated users
- Private testbank problems are visible only to the owner and students in shared classrooms
- Problems can belong to multiple testbanks
- The AI `create-problem` tool must ask which testbank to save to
- Teacher problems page uses tabs to switch between public and personal testbanks
- Students see a unified view (no tabs) with visibility filtering server-side
- Teachers can only edit/delete problems they created
- New problems default to public
- Existing problems migrate to public testbanks

## Data Model

### New tables

#### `testbanks`

| Column      | Type                    | Notes                              |
| ----------- | ----------------------- | ---------------------------------- |
| id          | text PK                 | UUID                               |
| name        | text NOT NULL           | e.g. "My Physics Bank"             |
| description | text                    | Optional                           |
| ownerId     | text FK -> user.id      | The teacher who created it         |
| isPublic    | boolean, default `true` | Public = visible to all users      |
| createdAt   | timestamp               | defaultNow                         |
| updatedAt   | timestamp               | defaultNow                         |

#### `testbank_problems` (many-to-many)

| Column     | Type                   | Notes            |
| ---------- | ---------------------- | ---------------- |
| id         | text PK                | UUID             |
| testbankId | text FK -> testbanks.id |                  |
| problemId  | text FK -> problems.id  |                  |
| createdAt  | timestamp              | defaultNow       |

Unique constraint on `(testbankId, problemId)`.

#### `testbank_classrooms` (sharing private testbanks with classrooms)

| Column      | Type                      | Notes      |
| ----------- | ------------------------- | ---------- |
| id          | text PK                   | UUID       |
| testbankId  | text FK -> testbanks.id    |            |
| classroomId | text FK -> classrooms.id   |            |
| createdAt   | timestamp                 | defaultNow |

Unique constraint on `(testbankId, classroomId)`.

### Changes to existing tables

- **`problems`**: No schema change. Ensure `createdBy` is always set on creation (fix `POST /api/teacher/problems` which currently omits it).

## Visibility Rules

| User role | Can see problems in...                                                           |
| --------- | -------------------------------------------------------------------------------- |
| Teacher   | All public testbanks + their own private testbanks                               |
| Student   | All public testbanks + private testbanks shared with any classroom they belong to |
| Admin     | Everything                                                                       |

## API Layer

### New endpoints

#### Testbank CRUD (teacher only)

- `GET /api/teacher/testbanks` — list the teacher's own testbanks (with problem count)
- `POST /api/teacher/testbanks` — create a new testbank (name, description, isPublic)
- `PUT /api/teacher/testbanks/[id]` — update name, description, isPublic (ownership check)
- `DELETE /api/teacher/testbanks/[id]` — delete a testbank; removes links only, problems stay

#### Testbank-problem linking

- `POST /api/teacher/testbanks/[id]/problems` — add problem(s) to a testbank (accepts array of problemIds)
- `DELETE /api/teacher/testbanks/[id]/problems/[problemId]` — remove a problem from a testbank

#### Testbank-classroom sharing

- `GET /api/teacher/testbanks/[id]/classrooms` — list classrooms this testbank is shared with
- `PUT /api/teacher/testbanks/[id]/classrooms` — set the shared classrooms (accepts array of classroomIds, replaces existing)

### Modified endpoints

#### `GET /api/problems`

Add query params:

- `testbankId` — return problems in a specific testbank (with auth check)
- `tab=public` — return all problems from public testbanks (deduplicated)
- `tab=mine` — return all problems from the calling teacher's own testbanks

Default (no tab): return all visible problems based on the user's role and visibility rules.

#### `POST /api/teacher/problems`

- Add optional `testbankIds` (string array) body param
- If provided: create the problem AND link it to those testbanks
- If not provided: create the problem without linking
- Always set `createdBy` to the session user ID (fix existing bug)

#### `DELETE /api/teacher/problems/[id]`

- Add ownership check: teachers can only delete problems where `createdBy` matches their userId
- Cascade delete from `testbank_problems`

### AI tool changes

#### `create-problem.ts`

- Add `testbankId` parameter (string, required)
- Description updated to instruct the AI to ask the teacher which testbank to save to before calling
- Tool validates the teacher owns the target testbank
- Inserts the problem and creates the `testbank_problems` link

#### New AI tool: `list-testbanks.ts`

- Returns the teacher's testbanks (id, name, isPublic) so the AI can present options before calling `create-problem`
- Uses the `AiToolContext` to get the userId and query their testbanks

#### `search-problems.ts`

- Add optional `testbankId` filter
- When provided, restricts search to problems in that specific testbank
- Visibility rules still enforced

## Frontend

### Teacher problems page (`/teacher/problems`)

Same route, add tabs at the top:

**Tab 1: "Public Testbank"**

- Shows all problems from all public testbanks (same grid layout as current)
- Search/filter unchanged
- Teacher can create/edit/delete their own problems
- "Create Problem" button defaults to public testbank

**Tab 2: "My Testbanks"**

- Shows a list of the teacher's own testbanks as cards (name, description, problem count, public/private badge)
- "Create Testbank" button
- Click a testbank -> shows problems inside it (same grid layout, filtered by `testbankId`)
- Each testbank card has actions: edit, delete, share (for private ones)

**Share dialog (for private testbanks):**

- Modal listing the teacher's classrooms with checkboxes
- Saves via `PUT /api/teacher/testbanks/[id]/classrooms`

### Teacher problem create page (`/teacher/problems/create`)

- Add a testbank selector (dropdown/multi-select) showing the teacher's testbanks
- Default: pre-select the first public testbank
- If navigated from a specific testbank view, pre-select that one

### Student problems page (`/student/problems`)

- No UI change. Visibility filtering happens server-side.
- The query now returns: all public testbank problems + problems from private testbanks shared with the student's classrooms

### AI chat (teacher)

- When `create-problem` is invoked, the AI asks which testbank to save to and presents the teacher's available testbanks
- Tool description updated to enforce this behavior

## Migration

1. Create `testbanks`, `testbank_problems`, `testbank_classrooms` tables
2. For each distinct `createdBy` in `problems`:
   - Create a public testbank named "Default Testbank" owned by that user
   - Link all their problems to it via `testbank_problems`
3. For problems with `createdBy = NULL`:
   - Create a system public testbank (owned by the first admin user)
   - Link orphaned problems to it
4. Backfill `createdBy` on orphaned problems (set to the system admin)

## Edge Cases

**Deleting a testbank:** Only removes `testbank_problems` and `testbank_classrooms` rows. Problems stay in the `problems` table. If a problem ends up in zero testbanks, it's only visible to its creator.

**Deleting a problem:** Cascade deletes from `testbank_problems`. Existing cascade logic for submissions stays unchanged.

**Deleting a classroom:** Cascade deletes from `testbank_classrooms`. Problems remain unaffected.

**Problem in both public and private testbanks:** Visible to everyone via the public testbank. Search results are deduplicated (a problem appears once even if in multiple matching testbanks).

**Teacher creates problem without selecting a testbank:** Problem is created but unlinked. Only visible to the creator until linked. UI should encourage selecting a testbank but not block creation.

## i18n

New translation keys in `en.json` and `zhTW.json`:

- Tab labels: "Public Testbank" / "My Testbanks"
- Testbank CRUD: create, edit, delete, share labels
- Testbank selector on problem create form
- Share dialog labels
- AI tool descriptions
