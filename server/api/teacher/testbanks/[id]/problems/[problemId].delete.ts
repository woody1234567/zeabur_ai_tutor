import { testbanks, testbankProblems } from "../../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  const problemId = getRouterParam(event, "problemId");
  if (!id || !problemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing IDs" });
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

  await useDrizzle()
    .delete(testbankProblems)
    .where(and(eq(testbankProblems.testbankId, id), eq(testbankProblems.problemId, problemId)));

  return { success: true };
});
