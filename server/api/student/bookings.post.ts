import { bookings, teacherAvailability } from "~~/db/schema";
import { eq, and, inArray } from "drizzle-orm";

interface BookingBody {
  availabilityId?: string;
  studentNote?: string;
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const body = await readBody<BookingBody>(event);
  const { availabilityId, studentNote } = body;

  if (!availabilityId) {
    throw createError({
      statusCode: 400,
      statusMessage: "availabilityId is required",
    });
  }

  const db = useDrizzle();

  const [slot] = await db
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.id, availabilityId))
    .limit(1);

  if (!slot) {
    throw createError({ statusCode: 404, statusMessage: "Slot not found" });
  }

  if (!slot.isAvailable) {
    throw createError({
      statusCode: 409,
      statusMessage: "Slot is no longer available",
    });
  }

  const existing = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.availabilityId, availabilityId),
        inArray(bookings.status, ["pending", "confirmed"]),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "This slot already has an active booking",
    });
  }

  const [newBooking] = await db
    .insert(bookings)
    .values({
      availabilityId,
      studentId: session.user.id,
      teacherId: slot.teacherId,
      status: "pending",
      studentNote: studentNote || null,
    })
    .returning();

  await db
    .update(teacherAvailability)
    .set({ isAvailable: false, updatedAt: new Date() })
    .where(eq(teacherAvailability.id, availabilityId));

  return newBooking;
});
