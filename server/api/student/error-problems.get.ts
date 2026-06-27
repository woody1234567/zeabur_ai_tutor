import {
  problems,
  errorProblems,
  problemsStatus,
} from "../../../db/schema";
import { and, eq, ilike, sql, desc } from "drizzle-orm";
import { updateProblemStatus } from "../../../server/utils/problemStatus";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  const query = getQuery(event);
  const title = query.title as string;
  const source = query.source as string;
  const hashtag = query.hashtag as string;

  const filters = [
    eq(errorProblems.userId, session.user.id),
  ];

  if (title) filters.push(ilike(problems.title, `%${title}%`));
  if (source) filters.push(ilike(problems.source, `%${source}%`));
  if (hashtag) {
    filters.push(sql`${problems.hashtags} @> ${JSON.stringify([hashtag])}`);
  }

  // Sync status first
  await updateProblemStatus(session.user.id);

  const results = await useDrizzle()
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
      isWrong: sql<boolean>`true`, // Always true for this list
      understood: problemsStatus.understood,
      errorCreatedAt: errorProblems.createdAt,
    })
    .from(errorProblems)
    .innerJoin(problems, eq(errorProblems.problemId, problems.id))
    .leftJoin(
      problemsStatus,
      and(
        eq(problemsStatus.problemId, problems.id),
        eq(problemsStatus.userId, session.user.id)
      )
    )
    .where(and(...filters))
    .orderBy(desc(errorProblems.createdAt));

  return results.map((p) => ({
    ...p,
    isFavorite: p.isFavorite ?? false,
    understood: p.understood ?? false,
  }));
});
