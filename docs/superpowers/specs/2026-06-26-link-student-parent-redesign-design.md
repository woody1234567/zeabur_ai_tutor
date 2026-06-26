# Design: Link Student-Parent Redesign with Unlink Support

**Date:** 2026-06-26  
**Status:** Approved

## Overview

Extend the admin parent-student linking flow to support unlinking. The current list page (`link-student-parent.vue`) replaces its direct "Link" action with a "View" action that navigates to a new detail page (`link-student-parent/[id].vue`). The detail page manages all link/unlink operations for a given student.

## Motivation

Admins currently have no way to remove an existing parent-student relationship. Splitting the action out into a dedicated detail page also gives a clearer view of a student's current parent connections before making changes.

## Pages

### Modified: `app/pages/admin/link-student-parent.vue`

- Remove `linkStudent` function and the confirm/alert for linking
- Replace "Link" button in search results table with "View" button
- "View" navigates to `link-student-parent/[studentId]?pendingParentId=<pendingParentId>`
- All other behaviour unchanged: search, role locked to student, pending parent info card at top

### New: `app/pages/admin/link-student-parent/[id].vue`

Route params: `id` = student ID  
Query params: `pendingParentId` (optional)

Layout sections (top to bottom):

1. **Back button + title** — back navigates to `link-student-parent?id=<pendingParentId>` if `pendingParentId` is present, otherwise to `/admin/pending-parents`
2. **Student card** — avatar, name, email fetched from the student-relationships API
3. **Pending parent card** (rendered only when `pendingParentId` is in query) — fetched via existing `GET /api/admin/pending-parents?id=<pendingParentId>`; shows parent name/email and the student info they requested; contains a "Link" button that calls `POST /api/admin/link-parent-student` then redirects to `/admin/pending-parents`
4. **Linked parents section** — table of currently connected parents (avatar, name, email, created-at); each row has an "Unlink" button with a `confirm()` dialog; calls `DELETE /api/admin/unlink-parent-student`; table shows an empty-state message when no parents are linked

## API Endpoints

### `GET /api/admin/student-relationships/[id]`

Returns student info and linked parents.

**Auth:** admin only  
**Response:**
```ts
{
  student: { id, name, email, image },
  parents: Array<{ id, name, email, image, linkedAt }>  // linkedAt = parentStudents.createdAt
}
```
Implementation: join `parentStudents` with `user` on `studentId = id` to get the student record, and on `parentId` to get each linked parent.

### `DELETE /api/admin/unlink-parent-student`

Removes a parent-student relationship.

**Auth:** admin only  
**Body:** `{ parentId: string, studentId: string }`  
**Response:** `{ success: true }`  
**Implementation:** delete row from `parentStudents` where `parentId` and `studentId` match; throw 404 if no row found.

### Existing (unchanged): `POST /api/admin/link-parent-student`

Used as-is from the detail page's "Link" button.

## Data Flow

```
pending-parents list
  → link-student-parent?id=<pendingParentId>   (search for student)
    → link-student-parent/[studentId]?pendingParentId=<pendingParentId>  (detail)
      → Link button  → POST link-parent-student → redirect to pending-parents
      → Unlink button → DELETE unlink-parent-student → refresh page
```

## Error Handling

- Student not found (invalid `[id]`): show error card, back button still works
- Link fails: alert with i18n error message (same pattern as existing code)
- Unlink fails: alert with i18n error message
- No linked parents: empty state message in the linked parents section

## i18n

New keys needed in `locales/en.json` and `locales/zhTW.json` under `admin.link_student`:

- `view` — "View" (button label)
- `linked_parents` — "Linked Parents" (section heading)
- `no_linked_parents` — "No parents linked yet"
- `unlink` — "Unlink"
- `confirm_unlink` — "Are you sure you want to unlink this parent?"
- `success_unlink` — "Parent unlinked successfully"
- `failed_unlink` — "Failed to unlink parent"
- `student_info` — "Student Info" (card heading)
