import { and, eq, desc } from "drizzle-orm";
import * as tables from "../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      message: "Only teachers can access this resource",
    });
  }

  const classroomId = getRouterParam(event, "id");
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      message: "Classroom ID is required",
    });
  }

  // Verify that the classroom belongs to the teacher
  const [classroom] = await useDrizzle()
    .select()
    .from(tables.classrooms)
    .where(
      and(
        eq(tables.classrooms.id, classroomId),
        eq(tables.classrooms.teacherId, session.user.id)
      )
    );

  if (!classroom) {
    throw createError({
      statusCode: 404,
      message: "Classroom not found or access denied",
    });
  }

  // Fetch homeworks for the classroom
  const homeworks = await useDrizzle()
    .select()
    .from(tables.homeworks)
    .where(eq(tables.homeworks.classroomId, classroomId))
    .orderBy(desc(tables.homeworks.createdAt));

  return homeworks;
});
