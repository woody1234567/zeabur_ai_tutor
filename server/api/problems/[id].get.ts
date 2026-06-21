import { db } from "../../../db";
import { problems, problemsStatus } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { eq, and } from "drizzle-orm";
import { updateProblemStatus } from "../../../server/utils/problemStatus";

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

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problem ID",
    });
  }

  // Sync status first
  await updateProblemStatus(session.user.id);

  const problem = await db
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
      isFavorite: problemsStatus.isFavorite,
      isWrong: problemsStatus.isWrong,
      understood: problemsStatus.understood,
      // We explicitly DO NOT return correctAnswer or explanation here
    })
    .from(problems)
    .leftJoin(
      problemsStatus,
      and(
        eq(problemsStatus.problemId, problems.id),
        eq(problemsStatus.userId, session.user.id)
      )
    )
    .where(eq(problems.id, id))
    .limit(1);

  const p = problem[0];

  if (!p) {
    throw createError({
      statusCode: 404,
      statusMessage: "Problem not found",
    });
  }

  return {
    ...p,
    isFavorite: p.isFavorite ?? false,
    isWrong: p.isWrong ?? false,
    understood: p.understood ?? false,
    isError: (p.isWrong && !p.understood) ?? false,
  };
});
