import { teacherAvailability } from "../../../db/schema";
import { eq, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  return await useDrizzle()
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.teacherId, session.user.id))
    .orderBy(asc(teacherAvailability.startTime));
});
