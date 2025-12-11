import { db } from "../../../db";
import { problems, favorites, errorProblems } from "../../../db/schema";
import { requireAuthSession } from "../../utils/auth";
import { and, eq, ilike, sql, desc } from "drizzle-orm";

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

  const favoriteProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      source: problems.source,
      hashtags: problems.hashtags,
      isFavorite: sql<boolean>`true`, // It's the favorites endpoint, so it's always true
      isError: sql<boolean>`EXISTS (
        SELECT 1 FROM ${errorProblems}
        WHERE ${errorProblems.problemId} = ${problems.id}
        AND ${errorProblems.userId} = ${session.user.id}
        AND ${errorProblems.understood} = false
      )`,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(problems, eq(favorites.problemId, problems.id))
    .where(and(...filters))
    .orderBy(desc(favorites.createdAt));

  return favoriteProblems;
});
