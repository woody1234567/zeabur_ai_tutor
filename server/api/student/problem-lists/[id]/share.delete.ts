import { problemLists } from "../../../../../db/schema";
import { requireAuthSession } from "../../../../utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const listId = getRouterParam(event, "id");
  if (!listId) throw createError({ statusCode: 400 });

  const [list] = await useDrizzle()
    .select({ id: problemLists.id })
    .from(problemLists)
    .where(and(eq(problemLists.id, listId), eq(problemLists.ownerId, session.user.id)))
    .limit(1);

  if (!list) throw createError({ statusCode: 404 });

  await useDrizzle()
    .update(problemLists)
    .set({ shareToken: null, updatedAt: new Date() })
    .where(eq(problemLists.id, listId));

  return { success: true };
});
