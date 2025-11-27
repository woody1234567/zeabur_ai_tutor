import { db } from "../../../../../db";
import { homeworks, homeworkCompletions } from "../../../../../db/schema";
import { auth } from "../../../../../server/utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const homeworkId = getRouterParam(event, "id");

  if (!homeworkId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Homework ID is required",
    });
  }

  // Fetch homework to get classroomId
  const [homework] = await db
    .select()
    .from(homeworks)
    .where(eq(homeworks.id, homeworkId));

  if (!homework) {
    throw createError({
      statusCode: 404,
      statusMessage: "Homework not found",
    });
  }

  // Check if already completed
  const [existing] = await db
    .select()
    .from(homeworkCompletions)
    .where(
      and(
        eq(homeworkCompletions.homeworkId, homeworkId),
        eq(homeworkCompletions.userId, session.user.id)
      )
    );

  if (existing) {
    return { success: true, message: "Already completed" };
  }

  // Record completion
  await db.insert(homeworkCompletions).values({
    homeworkId: homeworkId,
    classroomId: homework.classroomId,
    userId: session.user.id,
  });

  return { success: true };
});
