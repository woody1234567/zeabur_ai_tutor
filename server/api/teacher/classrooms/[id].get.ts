import { classrooms, classroomStudents, user } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../../../../server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing classroom ID",
    });
  }

  // Get classroom details
  const classroom = await useDrizzle()
    .select()
    .from(classrooms)
    .where(
      and(eq(classrooms.id, id), eq(classrooms.teacherId, session.user.id))
    )
    .limit(1);

  if (!classroom.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Classroom not found",
    });
  }

  // Get enrolled students
  const students = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      joinedAt: classroomStudents.joinedAt,
    })
    .from(classroomStudents)
    .innerJoin(user, eq(classroomStudents.studentId, user.id))
    .where(eq(classroomStudents.classroomId, id));

  return {
    ...classroom[0],
    students,
  };
});
