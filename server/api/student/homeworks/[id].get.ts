import { eq, asc, and } from "drizzle-orm";
import {
  homeworks,
  homeworkProblems,
  homeworkClassrooms,
  classroomStudents,
  problems,
  hwRecords,
  favorites,
} from "~~/db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (!session?.user || (session.user.role !== "student" && session.user.role !== "admin")) {
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

  // 1. Fetch homework details
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

  // Verify the student is enrolled in a classroom that owns this homework
  if (session.user.role === "student") {
    const directEnrollment = await useDrizzle()
      .select({ id: classroomStudents.id })
      .from(classroomStudents)
      .where(
        and(
          eq(classroomStudents.studentId, session.user.id),
          eq(classroomStudents.classroomId, homework.classroomId)
        )
      )
      .limit(1);

    let isEnrolled = directEnrollment.length > 0;

    if (!isEnrolled) {
      const indirectEnrollment = await useDrizzle()
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

  // 2. Fetch problems associated with the homework
  // We join homeworkProblems with problems to get the actual problem data
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
    //.orderBy(asc(homeworkProblems.order)) // If we had an order column. Schema has it as text?
    // Let's check schema again. `order: text("order")`.
    // We can try to order by it.
    .orderBy(asc(homeworkProblems.order));

  // 3. Fetch homework records for the current user
  const records = await useDrizzle()
    .select()
    .from(hwRecords)
    .where(
      and(
        eq(hwRecords.homeworkId, homeworkId),
        eq(hwRecords.userId, session.user.id)
      )
    );

  // Map records to problems
  const problemsWithStatus = problemList.map((problem) => {
    const record = records.find((r) => r.problemId === problem.id);
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
    };
  });

  return {
    homework,
    problems: problemsWithStatus,
  };
});
