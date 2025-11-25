import { classrooms } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "../../../server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || session.user.role !== "teacher") {
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
