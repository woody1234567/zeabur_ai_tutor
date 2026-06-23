import { testbanks, testbankProblems } from "../../../db/schema";
import { eq, or, sql, desc } from "drizzle-orm";
import { auth } from "../../../server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || session.user.role !== "student") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  // Testbanks the student may see: public ones, or shared with a classroom
  // the student is enrolled in. Mirrors server/utils/problems.ts visibility.
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
    .where(
      or(
        eq(testbanks.isPublic, true),
        sql`${testbanks.id} IN (
          SELECT tc.testbank_id FROM testbank_classrooms tc
          WHERE tc.classroom_id IN (
            SELECT cs.classroom_id FROM classroom_students cs
            WHERE cs.student_id = ${session.user.id}
          )
        )`
      )
    )
    .groupBy(testbanks.id)
    .orderBy(desc(testbanks.createdAt));

  return result;
});
