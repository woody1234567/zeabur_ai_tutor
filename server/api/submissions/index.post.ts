import { db } from "../../../db";
import {
  problems,
  submissions,
  homeworks,
  hwRecords,
  errorProblems,
} from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { problemId, userAnswer, homeworkId } = body;

  if (!problemId || userAnswer === undefined || userAnswer === null) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problemId or userAnswer",
    });
  }

  // Fetch the problem to check the answer
  const problem = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!problem.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Problem not found",
    });
  }

  const isCorrect = problem[0].correctAnswer === userAnswer;

  // Record the submission
  await db.insert(submissions).values({
    userId: session.user.id,
    problemId: problemId,
    userAnswer: userAnswer,
    isCorrect: isCorrect,
  });

  // Record in error_problems if incorrect
  if (!isCorrect) {
    const existingError = await db
      .select()
      .from(errorProblems)
      .where(
        and(
          eq(errorProblems.userId, session.user.id),
          eq(errorProblems.problemId, problemId)
        )
      )
      .limit(1);

    if (existingError.length > 0) {
      await db
        .update(errorProblems)
        .set({
          understood: false,
          createdAt: new Date(), // Update timestamp to show recent error
        })
        .where(eq(errorProblems.id, existingError[0].id));
    } else {
      await db.insert(errorProblems).values({
        userId: session.user.id,
        problemId: problemId,
        understood: false,
      });
    }
  }

  // If homeworkId is provided, record it in hwRecords
  if (homeworkId) {
    // Fetch homework to get classroomId
    const homework = await db.query.homeworks.findFirst({
      where: (homeworks, { eq }) => eq(homeworks.id, homeworkId),
    });

    if (homework) {
      // Check if a record already exists for this problem in this homework for this user
      // Actually, user might resubmit. Let's just insert a new record or update existing?
      // The requirement says "record student completion status".
      // Usually we want the *latest* status or *best* status.
      // Let's check if there's an existing record.
      const existingRecord = await db.query.hwRecords.findFirst({
        where: (hwRecords, { eq, and }) =>
          and(
            eq(hwRecords.homeworkId, homeworkId),
            eq(hwRecords.userId, session.user.id),
            eq(hwRecords.problemId, problemId)
          ),
      });

      if (existingRecord) {
        // Update existing record
        await db
          .update(hwRecords)
          .set({
            correctness: isCorrect,
            submitted: true,
            userAnswer: userAnswer,
            updatedAt: new Date(),
          })
          .where(eq(hwRecords.id, existingRecord.id));
      } else {
        // Insert new record
        await db.insert(hwRecords).values({
          homeworkId: homeworkId,
          classroomId: homework.classroomId,
          userId: session.user.id,
          problemId: problemId,
          correctness: isCorrect,
          submitted: true,
          userAnswer: userAnswer,
        });
      }
    }
  }

  return {
    correct: isCorrect,
    explanation: problem[0].explanation, // Return official explanation
    correctAnswer: problem[0].correctAnswer, // Reveal correct answer
  };
});
