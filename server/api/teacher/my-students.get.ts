import { user, classroomStudents, classrooms } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const teacherId = session.user.id;

  const students = await useDrizzle()
    .selectDistinct({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .innerJoin(classroomStudents, eq(user.id, classroomStudents.studentId))
    .innerJoin(classrooms, eq(classroomStudents.classroomId, classrooms.id))
    .where(eq(classrooms.teacherId, teacherId));

  return students;
});
