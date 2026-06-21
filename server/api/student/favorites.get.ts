import { db } from "../../../db";
import { problems, favorites, problemsStatus } from "../../../db/schema";
import { requireAuthSession } from "../../utils/auth";
import { and, eq, ilike, sql, desc } from "drizzle-orm";
import { updateProblemStatus } from "../../../server/utils/problemStatus";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  const query = getQuery(event);
  const title = query.title as string;
  const source = query.source as string;
  const hashtag = query.hashtag as string;

  const filters = [eq(favorites.userId, session.user.id)];

  if (title) filters.push(ilike(problems.title, `%${title}%`));
  if (source) filters.push(ilike(problems.source, `%${source}%`));
  if (hashtag) {
    filters.push(sql`${problems.hashtags} @> ${JSON.stringify([hashtag])}`);
  }

  // Sync status first
  await updateProblemStatus(session.user.id);

  const favoriteProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      subject: problems.subject,
      chapter: problems.chapter,
      grade: problems.grade,
      source: problems.source,
      hashtags: problems.hashtags,
      isFavorite: sql<boolean>`true`,
      isWrong: problemsStatus.isWrong,
      understood: problemsStatus.understood,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(problems, eq(favorites.problemId, problems.id))
    .leftJoin(
      problemsStatus,
      and(
        eq(problemsStatus.problemId, problems.id),
        eq(problemsStatus.userId, session.user.id)
      )
    )
    .where(and(...filters))
    .orderBy(desc(favorites.createdAt));

  return favoriteProblems.map((p) => ({
    ...p,
    isWrong: p.isWrong ?? false,
    understood: p.understood ?? false,
  }));

  return favoriteProblems;
});
