import { eq, asc } from "drizzle-orm";
import { homeworks, homeworkProblems, problems } from "~~/db/schema";

export default defineEventHandler(async (event) => {
  await requireAuthSession(event);
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

  // 2. Fetch problems associated with the homework
  // We join homeworkProblems with problems to get the actual problem data
  const problemList = await useDrizzle()
    .select({
      id: problems.id,
      title: problems.title,
      content: problems.content,
      choices: problems.choices,
      difficulty: problems.difficulty,
      source: problems.source,
      imageUrl: problems.imageUrl,
      // We don't select correctAnswer or explanation here to prevent cheating?
      // Actually, the existing problem view fetches everything including correctAnswer (but maybe hides it?).
      // Let's check the existing API `server/api/problems/[id].get.ts`.
      // The existing API returns everything. The frontend handles hiding it until submission.
      // However, for a secure homework system, we might want to hide it.
      // But for this MVP, let's stick to the pattern.
      // Wait, the existing `server/api/problems/[id].get.ts` returns `correctAnswer`?
      // Let's assume we should return enough to render the problem.
      // If we want to validate on server, we use `/api/submissions`.
      // So we can omit `correctAnswer` and `explanation` here if we want to be secure.
      // But the frontend `problems/[id].vue` expects `problem` object.
      // Let's check `app/pages/student/problems/[id].vue` again.
      // It uses `submissionResult` to show correct/incorrect.
      // It DOES NOT use `problem.correctAnswer` directly in the template to show the answer.
      // So it is safe-ish to not send it, OR send it but frontend doesn't show it.
      // BUT, if I send it, a smart student can see it in network tab.
      // For now, I will NOT send `correctAnswer` and `explanation` in this list.
      // The submission API will handle validation.
    })
    .from(homeworkProblems)
    .innerJoin(problems, eq(homeworkProblems.problemId, problems.id))
    .where(eq(homeworkProblems.homeworkId, homeworkId))
    //.orderBy(asc(homeworkProblems.order)) // If we had an order column. Schema has it as text?
    // Let's check schema again. `order: text("order")`.
    // We can try to order by it.
    .orderBy(asc(homeworkProblems.order));

  return {
    homework,
    problems: problemList,
  };
});
