import { teacherAvailability } from "../../../db/schema";

interface CreateScheduleBody {
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

  const body = await readBody<CreateScheduleBody>(event);
  const { startTime, endTime, description, isAvailable } = body;

  if (!startTime || !endTime) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start time and end time are required",
    });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError({ statusCode: 400, statusMessage: "Invalid event time" });
  }

  if (start >= end) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start time must be before end time",
    });
  }

  const [newEvent] = await useDrizzle()
    .insert(teacherAvailability)
    .values({
      teacherId: session.user.id,
      description: description || null,
      startTime: start,
      endTime: end,
      isAvailable: isAvailable ?? true,
    })
    .returning();

  return newEvent;
});
