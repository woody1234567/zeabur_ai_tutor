import {
  bookings,
  teacherAvailability,
  personalEvents,
  user,
} from "~~/db/schema";
import { eq } from "drizzle-orm";

interface ConfirmBody {
  teacherNote?: string;
}

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const bookingId = getRouterParam(event, "id");
  if (!bookingId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Booking id is required",
    });
  }

  const body = await readBody<ConfirmBody>(event);
  const db = useDrizzle();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw createError({ statusCode: 404, statusMessage: "Booking not found" });
  }

  if (booking.teacherId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: "Not your booking" });
  }

  if (booking.status !== "pending") {
    throw createError({
      statusCode: 400,
      statusMessage: "Only pending bookings can be confirmed",
    });
  }

  const [slot] = await db
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.id, booking.availabilityId))
    .limit(1);

  const [student] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, booking.studentId))
    .limit(1);

  const [teacher] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const [updated] = await db
    .update(bookings)
    .set({
      status: "confirmed",
      teacherNote: body.teacherNote || null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  const studentName = student?.name || "Student";
  const teacherName = teacher?.name || "Teacher";
  const slotTitle = slot?.description || "Class";
  const slotDescription = slot?.description || null;

  const teacherEventTitle = `Class: ${slotTitle} with ${studentName}`;
  const studentEventTitle = `Class: ${slotTitle} with ${teacherName}`;

  const [teacherEvent] = await db
    .insert(personalEvents)
    .values({
      userId: session.user.id,
      title: teacherEventTitle,
      start: slot!.startTime,
      end: slot!.endTime,
      allDay: false,
    })
    .returning();

  const [studentEvent] = await db
    .insert(personalEvents)
    .values({
      userId: booking.studentId,
      title: studentEventTitle,
      start: slot!.startTime,
      end: slot!.endTime,
      allDay: false,
    })
    .returning();

  return {
    booking: updated,
    teacherEventId: teacherEvent?.id,
    studentEventId: studentEvent?.id,
  };
});
