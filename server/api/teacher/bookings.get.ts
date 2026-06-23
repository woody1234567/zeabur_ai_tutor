import { bookings, teacherAvailability, user } from "~~/db/schema";
import { eq, and, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const statusFilter = query.status as string | undefined;

  const db = useDrizzle();

  const whereCondition = statusFilter
    ? and(
        eq(bookings.teacherId, session.user.id),
        eq(bookings.status, statusFilter),
      )
    : eq(bookings.teacherId, session.user.id);

  const results = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      studentNote: bookings.studentNote,
      teacherNote: bookings.teacherNote,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      availabilityId: bookings.availabilityId,
      studentId: bookings.studentId,
      studentName: user.name,
      studentEmail: user.email,
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
    .innerJoin(user, eq(bookings.studentId, user.id))
    .where(whereCondition)
    .orderBy(desc(bookings.createdAt));

  return results;
});
