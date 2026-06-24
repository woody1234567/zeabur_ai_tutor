import { classrooms, classroomStudents, user, teacherProfiles } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../../../../server/utils/auth";

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

  const classroomId = event.context.params?.id;
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  // Check if student is enrolled
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

  // Fetch classroom details
  const classroom = await useDrizzle()
    .select()
    .from(classrooms)
    .where(eq(classrooms.id, classroomId))
    .limit(1);

  if (classroom.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Classroom not found",
    });
  }

  // Fetch teacher profile
  const [teacher] = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: teacherProfiles.bio,
      interests: teacherProfiles.interests,
      teachingAreas: teacherProfiles.teachingAreas,
      teachingExperience: teacherProfiles.teachingExperience,
    })
    .from(user)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, user.id))
    .where(eq(user.id, classroom[0].teacherId))
    .limit(1);

  // Fetch students in the classroom
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
    .where(eq(classroomStudents.classroomId, classroomId));

  return {
    ...classroom[0],
    teacher: teacher || null,
    students,
  };
});
