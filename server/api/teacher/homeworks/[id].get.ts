import { eq, and, asc } from "drizzle-orm";
import {
  homeworks,
  homeworkProblems,
  problems,
  classrooms,
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
        classroomName: classrooms.name,
        classroomId: classrooms.id,
      })
      .from(homeworks)
      .leftJoin(classrooms, eq(homeworks.classroomId, classrooms.id))
      .where(
        and(eq(homeworks.id, homeworkId), eq(homeworks.teacherId, user.id))
      );

    if (!homework) {
      throw createError({
        statusCode: 404,
        message: "Homework not found",
      });
    }

    // 2. Fetch Associated Problems
    const associatedProblems = await useDrizzle()
      .select({
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        type: problems.choices, // Assuming choices structure implies type or we just show content
        content: problems.content,
        order: homeworkProblems.order,
      })
      .from(homeworkProblems)
      .innerJoin(problems, eq(homeworkProblems.problemId, problems.id))
      .where(eq(homeworkProblems.homeworkId, homeworkId));
    // .orderBy(asc(homeworkProblems.order)); // Order is text, might need casting if we want numeric sort, or just sort by creation if order is null
    // Let's try to sort by order if it exists

    // Sort manually if needed or just return as is. The schema has order as text.
    // Let's assume simple retrieval for now.

    return {
      homework,
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
