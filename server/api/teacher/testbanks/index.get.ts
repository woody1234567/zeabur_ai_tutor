import { testbanks, testbankProblems } from "../../../../db/schema";
import { eq, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const result = await useDrizzle()
    .select({
      id: testbanks.id,
      name: testbanks.name,
      description: testbanks.description,
      isPublic: testbanks.isPublic,
      createdAt: testbanks.createdAt,
      problemCount: sql<number>`count(${testbankProblems.id})::int`,
    })
    .from(testbanks)
    .leftJoin(testbankProblems, eq(testbankProblems.testbankId, testbanks.id))
    .where(eq(testbanks.ownerId, session.user.id))
    .groupBy(testbanks.id)
    .orderBy(desc(testbanks.createdAt));

  return result;
});
