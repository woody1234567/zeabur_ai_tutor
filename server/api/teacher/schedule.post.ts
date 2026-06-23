import { teacherAvailability } from "../../../db/schema";

interface CreateScheduleBody {
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  maxStudents?: number;
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const body = await readBody<CreateScheduleBody>(event);
  const { title, startTime, endTime, description, isAvailable, maxStudents } =
    body;

  if (!title || !startTime || !endTime) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title, start time, and end time are required",
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
      title,
      description: description || null,
      startTime: start,
      endTime: end,
      isAvailable: isAvailable ?? true,
      maxStudents: maxStudents ?? 1,
    })
    .returning();

  return newEvent;
});
