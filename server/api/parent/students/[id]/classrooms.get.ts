import { parentStudents } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "parent") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const parentId = session.user.id;
  const studentId = getRouterParam(event, "id");

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Student ID is required",
    });
  }

  // Security check: Ensure the parent is linked to the student
  const isMyChild = await useDrizzle()
    .select({ id: parentStudents.id })
    .from(parentStudents)
    .where(
      and(
        eq(parentStudents.parentId, parentId),
        eq(parentStudents.studentId, studentId)
      )
    )
    .limit(1);

  if (isMyChild.length === 0) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not authorized to view this student's details",
    });
  }

  return await getStudentClassrooms(studentId);
});
