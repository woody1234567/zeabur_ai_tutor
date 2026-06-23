import { testbanks } from "../../../../db/schema";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing testbank ID" });
  }

  const { name, description, isPublic } = await readBody(event);

  const result = await useDrizzle()
    .update(testbanks)
    .set({
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(isPublic !== undefined && { isPublic }),
      updatedAt: new Date(),
    })
    .where(and(eq(testbanks.id, id), eq(testbanks.ownerId, session.user.id)))
    .returning({ id: testbanks.id });

  if (result.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Testbank not found or not owned by you" });
  }

  return { success: true };
});
