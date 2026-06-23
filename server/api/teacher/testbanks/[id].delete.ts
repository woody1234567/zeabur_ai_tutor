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

  // onDelete: "cascade" on testbankProblems and testbankClassrooms handles cleanup
  const result = await useDrizzle()
    .delete(testbanks)
    .where(and(eq(testbanks.id, id), eq(testbanks.ownerId, session.user.id)))
    .returning({ id: testbanks.id });

  if (result.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Testbank not found or not owned by you" });
  }

  return { success: true };
});
