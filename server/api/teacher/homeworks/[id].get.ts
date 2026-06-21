import { eq, and } from "drizzle-orm";
import {
  homeworks,
  homeworkProblems,
  problems,
  classrooms,
  homeworkClassrooms,
} from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const { user } = session;

  if (user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      message: "Only teachers can access this endpoint",
    });
  }

  const homeworkId = getRouterParam(event, "id");
  if (!homeworkId) {
    throw createError({
      statusCode: 400,
      message: "Homework ID is required",
    });
  }

  try {
    // 1. Fetch Homework Details
    const [homework] = await useDrizzle()
      .select({
        id: homeworks.id,
        title: homeworks.title,
        subject: homeworks.subject,
        deadline: homeworks.deadline,
        createdAt: homeworks.createdAt,
        // Legacy support if needed, but we will fetch multiple classrooms below
        classroomId: homeworks.classroomId,
      })
      .from(homeworks)
      .where(
        and(eq(homeworks.id, homeworkId), eq(homeworks.teacherId, user.id))
      );

    if (!homework) {
      throw createError({
        statusCode: 404,
        message: "Homework not found",
      });
    }

    // 2. Fetch Assigned Classrooms
    const assignedClassrooms = await useDrizzle()
      .select({
        id: classrooms.id,
        name: classrooms.name,
      })
      .from(homeworkClassrooms)
      .innerJoin(classrooms, eq(homeworkClassrooms.classroomId, classrooms.id))
      .where(eq(homeworkClassrooms.homeworkId, homeworkId));

    // Fallback: if no classrooms in new table, check legacy column
    if (assignedClassrooms.length === 0 && homework.classroomId) {
      const [legacyClassroom] = await useDrizzle()
        .select({
          id: classrooms.id,
          name: classrooms.name,
        })
        .from(classrooms)
        .where(eq(classrooms.id, homework.classroomId));

      if (legacyClassroom) {
        assignedClassrooms.push(legacyClassroom);
      }
    }

    // 3. Fetch Associated Problems
    const associatedProblems = await useDrizzle()
      .select({
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        subject: problems.subject,
        chapter: problems.chapter,
        grade: problems.grade,
        type: problems.choices,
        content: problems.content,
        order: homeworkProblems.order,
      })
      .from(homeworkProblems)
      .innerJoin(problems, eq(homeworkProblems.problemId, problems.id))
      .where(eq(homeworkProblems.homeworkId, homeworkId));

    return {
      homework: {
        ...homework,
        classrooms: assignedClassrooms,
        classroomIds: assignedClassrooms.map((c) => c.id), // Convenience for frontend
        // Keep single name for compatibility with list view if needed, or just use first one
        classroomName: assignedClassrooms[0]?.name || "Unassigned",
        classroomId: assignedClassrooms[0]?.id || null,
      },
      problems: associatedProblems,
    };
  } catch (error: any) {
    console.error("Error fetching homework details:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to fetch homework details",
    });
  }
});
