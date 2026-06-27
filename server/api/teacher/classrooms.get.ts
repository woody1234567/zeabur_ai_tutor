import { classrooms } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const result = await useDrizzle()
    .select()
    .from(classrooms)
    .where(eq(classrooms.teacherId, session.user.id))
    .orderBy(desc(classrooms.createdAt));

  return result;
});
