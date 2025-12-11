import { db } from "../../../db";
import { problems, errorProblems, favorites } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { and, eq, ilike, sql, desc } from "drizzle-orm";

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

  const filters = [
    eq(errorProblems.userId, session.user.id),
    // We can filter by understood if we only want "active" errors,
    // but usually an error log history shows all errors or maybe just current ones.
    // The prompt implied "recorded... will be read", let's default to all for now or
    // maybe just those not understood? User said "recorded in error_problems... will be read".
    // I'll show all because "history" usually implies seeing what went wrong.
    // But commonly "mistake review" implies things you haven't fixed.
    // Let's stick to ALL checks in error_problems for this user.
  ];

  if (title) filters.push(ilike(problems.title, `%${title}%`));
  if (source) filters.push(ilike(problems.source, `%${source}%`));
  if (hashtag) {
    filters.push(sql`${problems.hashtags} @> ${JSON.stringify([hashtag])}`);
  }

  const results = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      source: problems.source,
      hashtags: problems.hashtags,
      // We need isFavorite to keep the UI consistent if we reuse the card
      isFavorite: sql<boolean>`EXISTS (
        SELECT 1 FROM ${favorites}
        WHERE ${favorites.problemId} = ${problems.id}
        AND ${favorites.userId} = ${session.user.id}
      )`,
      // It's definitely an error problem if it's in this list, but let's include the flag for UI consistency
      isError: sql<boolean>`true`,
      errorCreatedAt: errorProblems.createdAt,
    })
    .from(errorProblems)
    .innerJoin(problems, eq(errorProblems.problemId, problems.id))
    .where(and(...filters))
    .orderBy(desc(errorProblems.createdAt));

  return results;
});
