import {
  testbanks,
  testbankProblems,
  testbankClassrooms,
  classroomStudents,
} from "../../../../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "student") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const classroomId = event.context.params?.id;
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  // Check enrollment
  const enrollment = await useDrizzle()
    .select()
    .from(classroomStudents)
    .where(
      and(
        eq(classroomStudents.classroomId, classroomId),
        eq(classroomStudents.studentId, session.user.id)
      )
    )
    .limit(1);

  if (enrollment.length === 0) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not enrolled in this classroom",
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
