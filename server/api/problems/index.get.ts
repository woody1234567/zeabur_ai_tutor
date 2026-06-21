import { db } from "../../../db";
import { problems, problemsStatus } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { and, eq, ilike, sql } from "drizzle-orm";
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

  const query = getQuery(event);
  const title = query.title as string;
  const source = query.source as string;
  const hashtag = query.hashtag as string;
  const subject = query.subject as string;
  const chapter = query.chapter as string;
  const grade = query.grade as string;
  const difficulty = query.difficulty as string;

  const filters = [];
  if (title) filters.push(ilike(problems.title, `%${title}%`));
  if (source) filters.push(ilike(problems.source, `%${source}%`));
  if (hashtag) {
    filters.push(sql`${problems.hashtags} @> ${JSON.stringify([hashtag])}`);
  }
  if (subject) filters.push(eq(problems.subject, subject));
  if (chapter) filters.push(ilike(problems.chapter, `%${chapter}%`));
  if (grade) filters.push(eq(problems.grade, grade));
  if (difficulty) filters.push(eq(problems.difficulty, difficulty));

  // Sync status first
  await updateProblemStatus(session.user.id);

  const allProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      subject: problems.subject,
      chapter: problems.chapter,
      grade: problems.grade,
      source: problems.source,
      hashtags: problems.hashtags,
      isFavorite: problemsStatus.isFavorite,
      isWrong: problemsStatus.isWrong,
      understood: problemsStatus.understood,
    })
    .from(problems)
    .leftJoin(
      problemsStatus,
      and(
        eq(problemsStatus.problemId, problems.id),
        eq(problemsStatus.userId, session.user.id)
      )
    )
    .where(and(...filters));

  return allProblems.map((p) => ({
    ...p,
    // Map nulls (if no status record found) to false
    isFavorite: p.isFavorite ?? false,
    isWrong: p.isWrong ?? false,
    understood: p.understood ?? false,
    // Frontend expects isError for the X mark. We map isWrong to isError.
    // And if implied understood is false? User said "understood follows error_problems".
    // If isWrong is true, understood might be true or false.
    // Existing logic was: isError = (in error_problems AND understood=false).
    // New logic: isWrong comes from error_problems. understood comes from error_problems.
    // So isError = isWrong && !understood?
    // isError: (p.isWrong && !p.understood) ?? false,
  }));
});
