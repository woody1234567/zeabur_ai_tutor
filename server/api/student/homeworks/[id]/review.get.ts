import { eq, asc, and } from "drizzle-orm";
import {
  homeworks,
  homeworkProblems,
  problems,
  hwRecords,
  homeworkCompletions,
} from "~~/db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const homeworkId = getRouterParam(event, "id");

  if (!homeworkId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Homework ID is required",
    });
  }

  // 1. Check completion
  const [completion] = await useDrizzle()
    .select()
    .from(homeworkCompletions)
    .where(
      and(
        eq(homeworkCompletions.homeworkId, homeworkId),
        eq(homeworkCompletions.userId, session.user.id)
      )
    );

  if (!completion) {
    throw createError({
      statusCode: 403,
      statusMessage: "Homework not completed",
    });
  }

  // 2. Fetch homework details
  const [homework] = await useDrizzle()
    .select()
    .from(homeworks)
    .where(eq(homeworks.id, homeworkId));

  if (!homework) {
    throw createError({
      statusCode: 404,
      statusMessage: "Homework not found",
    });
  }

  // 3. Fetch problems with answers
  const problemList = await useDrizzle()
    .select({
      id: problems.id,
      title: problems.title,
      content: problems.content,
      choices: problems.choices,
      difficulty: problems.difficulty,
      source: problems.source,
      imageUrl: problems.imageUrl,
      correctAnswer: problems.correctAnswer, // Include answer
      explanation: problems.explanation, // Include explanation
    })
    .from(homeworkProblems)
    .innerJoin(problems, eq(homeworkProblems.problemId, problems.id))
    .where(eq(homeworkProblems.homeworkId, homeworkId))
    .orderBy(asc(homeworkProblems.order));

  // 4. Fetch user records
  const records = await useDrizzle()
    .select()
    .from(hwRecords)
    .where(
      and(
        eq(hwRecords.homeworkId, homeworkId),
        eq(hwRecords.userId, session.user.id)
      )
    );

  // Map records
  const problemsWithStatus = problemList.map((problem) => {
    const record = records.find((r) => r.problemId === problem.id);
    return {
      ...problem,
      submissionStatus: record
        ? {
            submitted: record.submitted,
            correct: record.correctness,
            userAnswer: record.userAnswer,
          }
        : null,
    };
  });

  return {
    homework,
    problems: problemsWithStatus,
  };
});
