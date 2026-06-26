import { user, studentProfiles } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || (session.user.role !== "student" && session.user.role !== "admin")) {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const [result] = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      gender: studentProfiles.gender,
      bio: studentProfiles.bio,
      interests: studentProfiles.interests,
    })
    .from(user)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
    .where(eq(user.id, session.user.id))
    .limit(1);

  return result;
});
