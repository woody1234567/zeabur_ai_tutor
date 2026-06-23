import { teacherAvailability } from "../../../db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  return await useDrizzle()
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.teacherId, session.user.id))
    .orderBy(asc(teacherAvailability.startTime));
});
