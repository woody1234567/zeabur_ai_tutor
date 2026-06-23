import { bookings, teacherAvailability } from "~~/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const bookingId = getRouterParam(event, "id");
  if (!bookingId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Booking id is required",
    });
  }

  const db = useDrizzle();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw createError({ statusCode: 404, statusMessage: "Booking not found" });
  }

  if (booking.studentId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: "Not your booking" });
  }

  if (booking.status !== "pending") {
    throw createError({
      statusCode: 400,
      statusMessage: "Only pending bookings can be cancelled",
    });
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();

  await db
    .update(teacherAvailability)
    .set({ isAvailable: true, updatedAt: new Date() })
    .where(eq(teacherAvailability.id, booking.availabilityId));

  return updated;
});
