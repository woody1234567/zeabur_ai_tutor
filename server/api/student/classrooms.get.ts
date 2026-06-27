import { classrooms, classroomStudents } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "student") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const result = await useDrizzle()
    .select({
      id: classrooms.id,
      name: classrooms.name,
      description: classrooms.description,
      teacherId: classrooms.teacherId,
      createdAt: classrooms.createdAt,
      updatedAt: classrooms.updatedAt,
    })
    .from(classroomStudents)
    .innerJoin(classrooms, eq(classroomStudents.classroomId, classrooms.id))
    .where(eq(classroomStudents.studentId, session.user.id))
    .orderBy(desc(classroomStudents.joinedAt));

  return result;
});
