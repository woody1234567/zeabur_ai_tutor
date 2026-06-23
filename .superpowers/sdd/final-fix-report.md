# Final Fix Report: Authorization/Visibility Findings

## FIX 1 (CRITICAL): Enforce visibility in `searchProblems`

**Files touched:**
- `server/utils/problems.ts` -- Added `viewerId` and `viewerRole` to `SearchProblemsCriteria`. Added visibility filter to the shared `filters` array so both semantic and keyword paths enforce it. Teachers see only problems in public testbanks or testbanks they own. Students see only problems in public testbanks or testbanks shared with classrooms they belong to.
- `server/utils/ai-tools/search-problems.ts` -- Updated `execute` to destructure `experimental_context`, cast to `AiToolContext`, and pass `viewerId`/`viewerRole` to `searchProblems`.
- `server/mcp/tools/search_problems.ts` -- Captured the `getMcpPrincipal()` return value and passed `principal.id` / `principal.role` as `viewerId` / `viewerRole` to `searchProblems`.

## FIX 2 (IMPORTANT): Validate testbank ownership in `POST /api/teacher/problems`

**Files touched:**
- `server/api/teacher/problems.post.ts` -- Added `testbanks` to schema import, added `and, eq, inArray` from `drizzle-orm`. Before inserting into `testbankProblems`, queries for owned testbanks matching the provided `testbankIds` and throws 403 if any are not owned by the caller.

## FIX 3 (IMPORTANT): Validate classroom ownership in `PUT /api/teacher/testbanks/[id]/classrooms`

**Files touched:**
- `server/api/teacher/testbanks/[id]/classrooms.put.ts` -- Added `classrooms` to schema import, added `inArray` to drizzle-orm import. After validating `classroomIds` array, queries for classrooms owned by the teacher and throws 403 if any are not owned.

## Typecheck

```
pnpm typecheck -> EXIT_CODE: 0
```

All changes compile without errors.

## Status: COMPLETE
