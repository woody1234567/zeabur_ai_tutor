import { problemLists, problemListItems } from "../../../../../../db/schema";
import { requireAuthSession } from "../../../../../utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const listId = getRouterParam(event, "id");
  const problemId = getRouterParam(event, "problemId");
  if (!listId || !problemId) throw createError({ statusCode: 400 });

  // Verify list ownership
  const [list] = await useDrizzle()
    .select({ id: problemLists.id })
    .from(problemLists)
    .where(and(eq(problemLists.id, listId), eq(problemLists.ownerId, session.user.id)))
    .limit(1);

  if (!list) throw createError({ statusCode: 404 });

  await useDrizzle()
    .delete(problemListItems)
    .where(
      and(
        eq(problemListItems.listId, listId),
        eq(problemListItems.problemId, problemId)
      )
    );

  return { success: true };
});
