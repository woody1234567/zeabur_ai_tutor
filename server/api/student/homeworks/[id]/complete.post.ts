import { db } from "../../../../../db";
import {
  homeworks,
  homeworkCompletions,
  homeworkClassrooms,
  classroomStudents,
} from "../../../../../db/schema";
import { auth } from "../../../../../server/utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || (session.user.role !== "student" && session.user.role !== "admin")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
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

  // Verify student is enrolled in a classroom that owns this homework
  if (session.user.role === "student") {
    const directEnrollment = await db
      .select({ id: classroomStudents.id })
      .from(classroomStudents)
      .where(
        and(
          eq(classroomStudents.studentId, session.user.id),
          eq(classroomStudents.classroomId, homework.classroomId!)
        )
      )
      .limit(1);

    let isEnrolled = directEnrollment.length > 0;

    if (!isEnrolled) {
      const indirectEnrollment = await db
        .select({ id: classroomStudents.id })
        .from(classroomStudents)
        .innerJoin(
          homeworkClassrooms,
          eq(classroomStudents.classroomId, homeworkClassrooms.classroomId)
        )
        .where(
          and(
            eq(classroomStudents.studentId, session.user.id),
            eq(homeworkClassrooms.homeworkId, homeworkId)
          )
        )
        .limit(1);

      isEnrolled = indirectEnrollment.length > 0;
    }

    if (!isEnrolled) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
    }
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
    classroomId: homework.classroomId!,
    userId: session.user.id,
  });

  return { success: true };
});
