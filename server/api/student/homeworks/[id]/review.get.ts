import { eq, asc, and } from "drizzle-orm";
import {
  homeworks,
  homeworkProblems,
  problems,
  hwRecords,
  homeworkCompletions,
  errorProblems,
  favorites,
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
      subject: problems.subject,
      chapter: problems.chapter,
      grade: problems.grade,
      source: problems.source,
      imageUrl: problems.imageUrl,
      correctAnswer: problems.correctAnswer,
      explanation: problems.explanation,
      isFavorite: favorites.id,
    })
    .from(homeworkProblems)
    .innerJoin(problems, eq(homeworkProblems.problemId, problems.id))
    .leftJoin(
      favorites,
      and(
        eq(favorites.problemId, problems.id),
        eq(favorites.userId, session.user.id)
      )
    )
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

  // 5. Fetch error problem records to know "understood" status
  const errorRecords = await useDrizzle()
    .select()
    .from(errorProblems)
    .where(
      and(
        eq(errorProblems.userId, session.user.id)
        // OPTIONAL: Filter by problem IDs to be more efficient,
        // but fetching all for user might be okay if not too many,
        // or we can use `inArray(errorProblems.problemId, problemList.map(p => p.id))`
      )
    );

  // Map records
  const problemsWithStatus = problemList.map((problem) => {
    const record = records.find((r) => r.problemId === problem.id);
    const errorRecord = errorRecords.find((r) => r.problemId === problem.id);

    return {
      ...problem,
      isFavorite: problem.isFavorite != null,
      submissionStatus: record
        ? {
            submitted: record.submitted,
            correct: record.correctness,
            userAnswer: record.userAnswer,
          }
        : null,
      understood: errorRecord ? errorRecord.understood : false,
    };
  });

  return {
    homework,
    problems: problemsWithStatus,
  };
});
