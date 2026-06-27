import {
  homeworks,
  classroomStudents,
  homeworkClassrooms,
  homeworkCompletions,
} from "../../../../../db/schema";
import { eq, and, desc, or } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "student") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const classroomId = event.context.params?.id;
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  // Check enrollment
  const enrollment = await useDrizzle()
    .select()
    .from(classroomStudents)
    .where(
      and(
        eq(classroomStudents.classroomId, classroomId),
        eq(classroomStudents.studentId, session.user.id)
      )
    )
    .limit(1);

  if (enrollment.length === 0) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not enrolled in this classroom",
    });
  }

  // Fetch homeworks
  const result = await useDrizzle()
    .selectDistinct({
      id: homeworks.id,
      teacherId: homeworks.teacherId,
      classroomId: homeworks.classroomId,
      subject: homeworks.subject,
      title: homeworks.title,
      deadline: homeworks.deadline,
      createdAt: homeworks.createdAt,
      updatedAt: homeworks.updatedAt,
      completedAt: homeworkCompletions.completedAt,
    })
    .from(homeworks)
    .leftJoin(
      homeworkClassrooms,
      eq(homeworks.id, homeworkClassrooms.homeworkId)
    )
    .leftJoin(
      homeworkCompletions,
      and(
        eq(homeworks.id, homeworkCompletions.homeworkId),
        eq(homeworkCompletions.userId, session.user.id)
      )
    )
    .where(
      or(
        eq(homeworks.classroomId, classroomId), //if we choose to save all the classrooms info in the homework_classrooms table, we don't have to include this line of code.
        eq(homeworkClassrooms.classroomId, classroomId)
      )
    )
    .orderBy(desc(homeworks.createdAt));

  return result;
});
