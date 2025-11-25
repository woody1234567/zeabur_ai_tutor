import { classroomStudents, classrooms } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../../../../../server/utils/auth";

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

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing classroom ID",
    });
  }

  const body = await readBody(event);
  const { studentId } = body;

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Student ID is required",
    });
  }

  // Verify classroom ownership
  const classroom = await useDrizzle()
    .select()
    .from(classrooms)
    .where(
      and(eq(classrooms.id, id), eq(classrooms.teacherId, session.user.id))
    )
    .limit(1);

  if (!classroom.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Classroom not found or unauthorized",
    });
  }

  // Remove student
  await useDrizzle()
    .delete(classroomStudents)
    .where(
      and(
        eq(classroomStudents.classroomId, id),
        eq(classroomStudents.studentId, studentId)
      )
    );

  return { success: true };
});
