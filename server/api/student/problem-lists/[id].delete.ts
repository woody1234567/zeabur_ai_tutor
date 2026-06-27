import { problemLists } from "../../../../db/schema";
import { requireAuthSession } from "../../../utils/auth";
import { eq } from "drizzle-orm";

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

  await useDrizzle().delete(problemLists).where(eq(problemLists.id, listId));

  return { success: true };
});
