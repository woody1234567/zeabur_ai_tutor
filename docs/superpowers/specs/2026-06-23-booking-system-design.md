# Booking System Design

## Context

Teachers can already create availability slots (`teacherAvailability` table) and students can browse them at `/student/teachers/[id]`. The "Book" button exists but is a placeholder. This spec adds the booking lifecycle: student books a slot, teacher confirms or rejects, and confirmed bookings auto-create calendar events for both parties.

## Requirements

- **1-on-1 only**: Each availability slot supports exactly one booking.
- **Teacher confirmation required**: Bookings start as `pending`; teacher must explicitly confirm or reject.
- **Slot locking**: When a student books, the slot is immediately marked unavailable to prevent double-booking. Rejection or cancellation reopens it.
- **Student cancellation**: Students can cancel their own pending bookings. Confirmed bookings cannot be cancelled by the student.
- **Calendar integration**: On confirmation, a `personalEvent` is created for both teacher and student, making the class appear on their dashboards automatically.
- **Rich event info**: Calendar events include the slot title, description, teacher/student name, and start/end times.
- **Notes**: Students can attach a note when booking; teachers can attach a note when confirming or rejecting.

## Database Schema

### New table: `bookings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `availabilityId` | uuid | FK → `teacherAvailability.id`, NOT NULL | The slot being booked |
| `studentId` | uuid | FK → `user.id`, NOT NULL | Student who booked |
| `teacherId` | uuid | FK → `user.id`, NOT NULL | Denormalized from availability for query efficiency |
| `status` | text | NOT NULL, default `'pending'` | One of: `pending`, `confirmed`, `rejected`, `cancelled` |
| `studentNote` | text | nullable | Optional message from student when booking |
| `teacherNote` | text | nullable | Optional message from teacher on confirm/reject |
| `createdAt` | timestamp | NOT NULL, default now | |
| `updatedAt` | timestamp | NOT NULL, default now | |

Unique constraint on `(availabilityId)` where `status IN ('pending', 'confirmed')` is enforced at the application level (check before insert) since Drizzle doesn't support partial unique indexes directly.

## API Endpoints

### Student-facing

**`POST /api/student/bookings`**
- Body: `{ availabilityId: string, studentNote?: string }`
- Validates: slot exists, `isAvailable === true`, student role, no existing pending/confirmed booking for this slot
- Actions: Insert booking as `pending`, set `teacherAvailability.isAvailable = false`
- Returns: created booking object

**`GET /api/student/bookings`**
- Returns: all bookings for the authenticated student, joined with teacher name and availability slot details
- Ordered by `createdAt` desc

**`DELETE /api/student/bookings/[id]`**
- Validates: booking belongs to student, status is `pending`
- Actions: Set booking status to `cancelled`, set `teacherAvailability.isAvailable = true`
- Returns: updated booking

### Teacher-facing

**`GET /api/teacher/bookings`**
- Query params: optional `status` filter
- Returns: all bookings for the teacher's availability slots, joined with student name
- Ordered by `createdAt` desc

**`PUT /api/teacher/bookings/[id]/confirm`**
- Body: `{ teacherNote?: string }`
- Validates: booking belongs to teacher's slot, status is `pending`
- Actions:
  1. Set booking status to `confirmed`, save teacherNote
  2. Read the availability slot's title, description, startTime, endTime
  3. Read student and teacher names
  4. Insert `personalEvent` for teacher: title = "Class: {slotTitle} with {studentName}", start/end from slot
  5. Insert `personalEvent` for student: title = "Class: {slotTitle} with {teacherName}", start/end from slot
- Returns: updated booking + created event IDs

**`PUT /api/teacher/bookings/[id]/reject`**
- Body: `{ teacherNote?: string }`
- Validates: booking belongs to teacher's slot, status is `pending`
- Actions: Set booking status to `rejected`, save teacherNote, set `teacherAvailability.isAvailable = true`
- Returns: updated booking

## UI Changes

### Teacher: `/teacher/schedule` page

Add a "Pending Bookings" section to the existing schedule page:
- Shows cards for each pending booking: student name, slot title/time, student note
- Each card has Confirm and Reject buttons
- Confirm opens a small modal for optional teacher note, then calls confirm API
- Reject opens a small modal for optional teacher note, then calls reject API
- On action, refresh the bookings list and schedule calendar
- Badge/count indicator showing number of pending bookings

### Student: `/student/teachers/[id]` page

- Wire the existing "Book" button in `ScheduleEventCard` to open a booking modal
- Modal: shows slot details, optional note textarea, confirm/cancel buttons
- On book: call `POST /api/student/bookings`, refresh the slots list
- After booking, the slot card shows "Pending" status instead of "Available"

### Student: `/student/index` dashboard

Add a "My Bookings" section below/above the calendar:
- Lists recent bookings with status badges (pending=warning, confirmed=success, rejected=error, cancelled=gray)
- Each card shows: teacher name, slot title, date/time, status, any teacher note
- Pending bookings show a "Cancel" button
- Fetches from `GET /api/student/bookings`

### Calendar (automatic)

No changes needed to `CommonEventCalendar` — it already reads from `personalEvents`. Confirmed bookings will appear automatically after the confirm API creates the events.

## i18n Keys to Add

Both `en.json` and `zhTW.json` need keys under:
- `student.bookings.*` — My Bookings section (title, status labels, cancel, no bookings, notes)
- `student.teachers.booking_modal.*` — Booking modal (title, note placeholder, confirm, cancel)
- `teacher.bookings.*` — Pending bookings section (title, confirm, reject, note modal, empty state)

## State Machine

```
Student books slot
       │
       ▼
    PENDING ──── Student cancels ──── CANCELLED
       │                                  │
       ├── Teacher confirms               │
       │         │                        │
       │         ▼                        │
       │    CONFIRMED                     │
       │   (events created)               │
       │                                  │
       └── Teacher rejects ──── REJECTED  │
                                   │      │
                                   ▼      ▼
                              Slot reopens
```

## Error Handling

- Double-booking prevention: Check `isAvailable` before insert; if race condition, the second request gets a "slot no longer available" error.
- Stale state: If teacher tries to confirm an already-cancelled booking, return 400.
- Orphan prevention: If an availability slot is deleted while a booking is pending, cascade or return error (prefer returning error — teacher should reject first).

## Testing Strategy

- API integration tests: booking lifecycle (create → confirm → events exist; create → reject → slot reopened; create → cancel → slot reopened)
- UI: manual testing via dev server — book a slot as student, confirm as teacher, verify events appear on both calendars
