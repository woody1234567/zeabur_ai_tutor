import { db } from "../../../db";
import { problems } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";

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

  const allProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      source: problems.source,
      hashtags: problems.hashtags,
    })
    .from(problems);

  return allProblems;
});
