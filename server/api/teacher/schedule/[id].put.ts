import { teacherAvailability } from "../../../../db/schema";
import { eq } from "drizzle-orm";

interface UpdateScheduleBody {
  description?: string | null;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Invalid event id" });
  }

  const body = await readBody<UpdateScheduleBody>(event);

  const [existing] = await useDrizzle()
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.id, id))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Event not found" });
  }

  if (existing.teacherId !== session.user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can only update your own events",
    });
  }

  const start = body.startTime ? new Date(body.startTime) : existing.startTime;
  const end = body.endTime ? new Date(body.endTime) : existing.endTime;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError({ statusCode: 400, statusMessage: "Invalid event time" });
  }

  if (start >= end) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start time must be before end time",
    });
  }

  const [updated] = await useDrizzle()
    .update(teacherAvailability)
    .set({
      description: body.description !== undefined ? body.description : existing.description,
      startTime: start,
      endTime: end,
      isAvailable: body.isAvailable ?? existing.isAvailable,
      updatedAt: new Date(),
    })
    .where(eq(teacherAvailability.id, id))
    .returning();

  return updated;
});
