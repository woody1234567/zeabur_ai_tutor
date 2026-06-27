import { problemLists, problemListItems } from "../../../../db/schema";
import { requireAuthSession } from "../../../utils/auth";
import { eq, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const lists = await useDrizzle()
    .select({
      id: problemLists.id,
      name: problemLists.name,
      description: problemLists.description,
      shareToken: problemLists.shareToken,
      itemCount: sql<number>`count(${problemListItems.id})::int`,
      createdAt: problemLists.createdAt,
      updatedAt: problemLists.updatedAt,
    })
    .from(problemLists)
    .leftJoin(problemListItems, eq(problemListItems.listId, problemLists.id))
    .where(eq(problemLists.ownerId, session.user.id))
    .groupBy(problemLists.id)
    .orderBy(desc(problemLists.createdAt));

  return lists;
});
