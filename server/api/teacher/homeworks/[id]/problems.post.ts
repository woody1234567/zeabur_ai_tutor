import {
  homeworkProblems,
  homeworks,
  problems,
} from "../../../../../db/schema";
import { eq, and, inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const homeworkId = event.context.params?.id;
  if (!homeworkId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Homework ID is required",
    });
  }

  const body = await readBody(event);
  const { problemIds } = body;

  if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "problemIds array is required",
    });
  }

  try {
    // Verify homework ownership
    const [homework] = await useDrizzle()
      .select()
      .from(homeworks)
      .where(
        and(
          eq(homeworks.id, homeworkId),
          eq(homeworks.teacherId, session.user.id)
        )
      );

    if (!homework) {
      throw createError({
        statusCode: 404,
        statusMessage: "Homework not found or unauthorized",
      });
    }

    // Filter out problems that are already assigned to this homework
    const existingAssociations = await useDrizzle()
      .select({ problemId: homeworkProblems.problemId })
      .from(homeworkProblems)
      .where(
        and(
          eq(homeworkProblems.homeworkId, homeworkId),
          inArray(homeworkProblems.problemId, problemIds)
        )
      );

    const existingProblemIds = new Set(
      existingAssociations.map((p) => p.problemId)
    );
    const newProblemIds = problemIds.filter(
      (id) => !existingProblemIds.has(id)
    );

    if (newProblemIds.length === 0) {
      return { success: true, message: "No new problems to add" };
    }

    // Insert new associations
    await useDrizzle()
      .insert(homeworkProblems)
      .values(
        newProblemIds.map((problemId) => ({
          homeworkId,
          problemId,
        }))
      );

    return { success: true, addedCount: newProblemIds.length };
  } catch (error: any) {
    console.error("Error adding problems to homework:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to add problems to homework",
    });
  }
});
