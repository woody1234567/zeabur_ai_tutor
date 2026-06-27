import { problemLists, problemListItems, problems, testbankProblems, testbanks, testbankClassrooms, classroomStudents } from "../../../../../db/schema";
import { requireAuthSession } from "../../../../utils/auth";
import { eq, and, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const listId = getRouterParam(event, "id");
  if (!listId) throw createError({ statusCode: 400 });

  const body = await readBody(event);
  const problemId = body?.problemId;
  if (!problemId) {
    throw createError({ statusCode: 400, statusMessage: "problemId is required" });
  }

  // Verify list ownership
  const [list] = await useDrizzle()
    .select({ id: problemLists.id })
    .from(problemLists)
    .where(and(eq(problemLists.id, listId), eq(problemLists.ownerId, session.user.id)))
    .limit(1);

  if (!list) throw createError({ statusCode: 404 });

  // Verify student has access to this problem (public testbank OR shared with student's classroom)
  const [accessible] = await useDrizzle()
    .select({ id: problems.id })
    .from(problems)
    .where(
      and(
        eq(problems.id, problemId),
        sql`EXISTS (
          SELECT 1 FROM ${testbankProblems} tp
          JOIN ${testbanks} tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND (
            tb.is_public = true
            OR tb.id IN (
              SELECT tc.testbank_id FROM ${testbankClassrooms} tc
              WHERE tc.classroom_id IN (
                SELECT cs.classroom_id FROM ${classroomStudents} cs
                WHERE cs.student_id = ${session.user.id}
              )
            )
          )
        )`
      )
    )
    .limit(1);

  if (!accessible) {
    throw createError({ statusCode: 403, statusMessage: "Problem not accessible" });
  }

  // Insert (ignore if already present due to unique constraint)
  const existing = await useDrizzle()
    .select({ id: problemListItems.id })
    .from(problemListItems)
    .where(and(eq(problemListItems.listId, listId), eq(problemListItems.problemId, problemId)))
    .limit(1);

  if (existing.length > 0) {
    return { success: true, alreadyAdded: true };
  }

  await useDrizzle().insert(problemListItems).values({ listId, problemId });

  return { success: true, alreadyAdded: false };
});
