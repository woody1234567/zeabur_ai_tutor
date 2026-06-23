import { bookings, teacherAvailability, user } from "~~/db/schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const results = await useDrizzle()
    .select({
      id: bookings.id,
      status: bookings.status,
      studentNote: bookings.studentNote,
      teacherNote: bookings.teacherNote,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      availabilityId: bookings.availabilityId,
      teacherId: bookings.teacherId,
      teacherName: user.name,
      slotTitle: teacherAvailability.title,
      slotDescription: teacherAvailability.description,
      slotStartTime: teacherAvailability.startTime,
      slotEndTime: teacherAvailability.endTime,
    })
    .from(bookings)
    .innerJoin(
      teacherAvailability,
      eq(bookings.availabilityId, teacherAvailability.id),
    )
    .innerJoin(user, eq(bookings.teacherId, user.id))
    .where(eq(bookings.studentId, session.user.id))
    .orderBy(desc(bookings.createdAt));

  return results;
});
