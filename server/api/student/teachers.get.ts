import { user, teacherProfiles } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const teachers = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: teacherProfiles.bio,
      teachingAreas: teacherProfiles.teachingAreas,
    })
    .from(user)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, user.id))
    .where(eq(user.role, "teacher"));

  return teachers;
});
