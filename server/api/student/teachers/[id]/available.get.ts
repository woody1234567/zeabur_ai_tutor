import { user, teacherAvailability, teacherProfiles } from "../../../../../db/schema";
import { eq, and, asc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const teacherId = getRouterParam(event, "id");
  if (!teacherId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Teacher id is required",
    });
  }

  const [teacher] = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      bio: teacherProfiles.bio,
      interests: teacherProfiles.interests,
      teachingAreas: teacherProfiles.teachingAreas,
      teachingExperience: teacherProfiles.teachingExperience,
    })
    .from(user)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, user.id))
    .where(eq(user.id, teacherId))
    .limit(1);

  if (!teacher || teacher.role !== "teacher") {
    throw createError({
      statusCode: 404,
      statusMessage: "Teacher not found",
    });
  }

  const availableSlots = await useDrizzle()
    .select()
    .from(teacherAvailability)
    .where(
      and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.isAvailable, true)
      )
    )
    .orderBy(asc(teacherAvailability.startTime));

  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      image: teacher.image,
      bio: teacher.bio,
      interests: teacher.interests,
      teachingAreas: teacher.teachingAreas,
      teachingExperience: teacher.teachingExperience,
    },
    availableSlots,
  };
});
