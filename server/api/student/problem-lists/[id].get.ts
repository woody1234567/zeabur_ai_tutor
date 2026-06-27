import { problemLists, problemListItems, problems } from "../../../../db/schema";
import { requireAuthSession } from "../../../utils/auth";
import { eq, and, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const listId = getRouterParam(event, "id");
  if (!listId) throw createError({ statusCode: 400 });

  const [list] = await useDrizzle()
    .select()
    .from(problemLists)
    .where(eq(problemLists.id, listId))
    .limit(1);

  if (!list) throw createError({ statusCode: 404 });
  if (list.ownerId !== session.user.id) throw createError({ statusCode: 403 });

  const items = await useDrizzle()
    .select({
      id: problemListItems.id,
      problemId: problemListItems.problemId,
      addedAt: problemListItems.addedAt,
      problem: {
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        subject: problems.subject,
        chapter: problems.chapter,
        grade: problems.grade,
        source: problems.source,
        hashtags: problems.hashtags,
      },
    })
    .from(problemListItems)
    .innerJoin(problems, eq(problemListItems.problemId, problems.id))
    .where(eq(problemListItems.listId, listId))
    .orderBy(asc(problemListItems.addedAt));

  return { ...list, items };
});
