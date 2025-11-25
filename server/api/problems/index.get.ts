import { db } from "../../../db";
import { problems } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { and, ilike, sql } from "drizzle-orm";

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

  const filters = [];
  if (title) filters.push(ilike(problems.title, `%${title}%`));
  if (source) filters.push(ilike(problems.source, `%${source}%`));
  if (hashtag) {
    // Check if the JSONB array contains the hashtag
    filters.push(sql`${problems.hashtags} @> ${JSON.stringify([hashtag])}`);
  }

  const allProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      source: problems.source,
      hashtags: problems.hashtags,
    })
    .from(problems)
    .where(and(...filters));

  return allProblems;
});
