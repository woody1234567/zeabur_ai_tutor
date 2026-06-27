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

  const body = await readBody(event);
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body?.name?.trim()) updates.name = body.name.trim();
  if ("description" in body) updates.description = body.description?.trim() || null;

  const [updated] = await useDrizzle()
    .update(problemLists)
    .set(updates)
    .where(eq(problemLists.id, listId))
    .returning();

  return updated;
});
