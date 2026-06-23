import {
  testbanks,
  testbankProblems,
  testbankClassrooms,
  classrooms,
} from "../../../../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const classroomId = getRouterParam(event, "id");
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  // Verify that the classroom belongs to the teacher
  const [classroom] = await useDrizzle()
    .select({ id: classrooms.id })
    .from(classrooms)
    .where(
      and(
        eq(classrooms.id, classroomId),
        eq(classrooms.teacherId, session.user.id)
      )
    )
    .limit(1);

  if (!classroom) {
    throw createError({
      statusCode: 404,
      statusMessage: "Classroom not found or access denied",
    });
  }

  // Fetch testbanks shared with this classroom
  const result = await useDrizzle()
    .select({
      id: testbanks.id,
      name: testbanks.name,
      description: testbanks.description,
      isPublic: testbanks.isPublic,
      createdAt: testbanks.createdAt,
      problemCount: sql<number>`count(${testbankProblems.id})::int`,
    })
    .from(testbankClassrooms)
    .innerJoin(testbanks, eq(testbanks.id, testbankClassrooms.testbankId))
    .leftJoin(testbankProblems, eq(testbankProblems.testbankId, testbanks.id))
    .where(eq(testbankClassrooms.classroomId, classroomId))
    .groupBy(testbanks.id)
    .orderBy(desc(testbanks.createdAt));

  return result;
});
