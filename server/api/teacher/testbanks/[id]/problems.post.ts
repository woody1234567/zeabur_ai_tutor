import { testbanks, testbankProblems } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing testbank ID" });
  }

  // Verify ownership
  const [tb] = await useDrizzle()
    .select({ id: testbanks.id })
    .from(testbanks)
    .where(and(eq(testbanks.id, id), eq(testbanks.ownerId, session.user.id)))
    .limit(1);

  if (!tb) {
    throw createError({ statusCode: 404, statusMessage: "Testbank not found or not owned by you" });
  }

  const { problemIds } = await readBody(event);
  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "problemIds array is required" });
  }

  await useDrizzle()
    .insert(testbankProblems)
    .values(problemIds.map((problemId: string) => ({ testbankId: id, problemId })))
    .onConflictDoNothing();

  return { success: true, linked: problemIds.length };
});
