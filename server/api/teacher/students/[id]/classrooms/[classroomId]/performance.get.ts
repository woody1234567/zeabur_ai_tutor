import {
  classrooms,
  homeworks,
  homeworkCompletions,
  hwRecords,
  homeworkProblems,
  user,
} from "../../../../../../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const teacherId = session.user.id;
  const studentId = getRouterParam(event, "id");
  const classroomId = getRouterParam(event, "classroomId");

  if (!studentId || !classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Student ID and Classroom ID are required",
    });
  }

  // Security check: Ensure the teacher owns the classroom
  const classroom = await useDrizzle()
    .select()
    .from(classrooms)
    .where(
      and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, teacherId))
    )
    .limit(1);

  if (classroom.length === 0) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not authorized to view this classroom",
    });
  }

  return await getStudentClassroomPerformance(studentId, classroomId);
});
