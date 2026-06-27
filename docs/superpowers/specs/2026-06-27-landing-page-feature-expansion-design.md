# Landing Page Feature Expansion

**Date:** 2026-06-27  
**Status:** Approved

## Goal

Expand `app/pages/index.vue` to surface more of the platform's documented features, targeting all user roles equally (students, teachers, parents).

## Changes

### 1. Extended Feature Grid

Extend the existing `grid-cols-1 md:grid-cols-3` feature card grid from 3 cards to 6 (2 rows). Three new cards are added:

| New Card | i18n key | Description copy |
|---|---|---|
| AI Tutor Chat | `landing.features.ai_tutor_chat` | Streaming AI chat for personalized problem explanations with tool-assisted recommendations |
| Class Materials | `landing.features.class_materials` | Teachers upload and organize materials; students access shared files by classroom |
| Teacher Scheduling | `landing.features.scheduling` | Teachers publish available time slots; students browse and book sessions |

Each new card follows the exact same DaisyUI `card bg-base-100 shadow-xl` structure as the existing 3 cards, with an SVG icon, translated title, and translated description.

### 2. "Built for Everyone" Role Section

A new section appended below the feature grid, styled consistently with the existing features section (`py-20 container mx-auto px-4`).

- **Section heading:** `landing.roles.title` — "Built for Everyone"
- **Layout:** `grid-cols-1 md:grid-cols-3` — one column per role, collapses to 1 on mobile
- **Each column:** role name as `<h3>`, followed by an unordered list of feature bullets

Role feature lists:

**Student** (`landing.roles.student.*`):
1. Practice problems from the testbank
2. Track wrong answers and save favorites
3. Complete and review homework assignments
4. Access class materials shared by teachers
5. Browse teacher profiles and book sessions

**Teacher** (`landing.roles.teacher.*`):
1. Build a problem bank with AI assistance
2. Manage classrooms and enrolled students
3. Assign homework and track completion scores
4. Upload and share class materials
5. Publish schedules and manage student bookings

**Parent** (`landing.roles.parent.*`):
1. Link your account to your child's student account
2. View classroom enrollments
3. Monitor homework performance and scores
4. Track progress across multiple classrooms

### 3. i18n

New translation keys added to **both** `i18n/locales/en.json` and `i18n/locales/zhTW.json`:

Under `landing.features`:
- `ai_tutor_chat.title` / `ai_tutor_chat.description`
- `class_materials.title` / `class_materials.description`
- `scheduling.title` / `scheduling.description`

New top-level namespace `landing.roles`:
- `title`
- `student.title` + `student.feature_1` … `student.feature_5`
- `teacher.title` + `teacher.feature_1` … `teacher.feature_5`
- `parent.title` + `parent.feature_1` … `parent.feature_4`

## Files to Change

1. `i18n/locales/en.json` — add new keys
2. `i18n/locales/zhTW.json` — add translated keys
3. `app/pages/index.vue` — add 3 new feature cards + new role section

## Out of Scope

- Navigation changes
- New pages or routes
- Changes to existing 3 feature cards
- PWA features (not surfaced on landing page by design)
