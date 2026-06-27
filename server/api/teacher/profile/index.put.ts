import { user, teacherProfiles } from "../../../../db/schema";
import { eq } from "drizzle-orm";

interface UpdateProfileBody {
  name?: string;
  gender?: string | null;
  bio?: string | null;
  interests?: string | null;
  teachingAreas?: string | null;
  teachingExperience?: string | null;
}

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const body = await readBody<UpdateProfileBody>(event);

  if (!body.name || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  if (body.name.length > 100) {
    throw createError({ statusCode: 400, statusMessage: "Name is too long" });
  }

  if (body.bio && body.bio.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: "Bio is too long" });
  }

  if (body.teachingExperience && body.teachingExperience.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: "Teaching experience is too long" });
  }

  await useDrizzle()
    .update(user)
    .set({ name: body.name.trim(), updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  await useDrizzle()
    .insert(teacherProfiles)
    .values({
      userId: session.user.id,
      gender: body.gender || null,
      bio: body.bio || null,
      interests: body.interests || null,
      teachingAreas: body.teachingAreas || null,
      teachingExperience: body.teachingExperience || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: teacherProfiles.userId,
      set: {
        gender: body.gender || null,
        bio: body.bio || null,
        interests: body.interests || null,
        teachingAreas: body.teachingAreas || null,
        teachingExperience: body.teachingExperience || null,
        updatedAt: new Date(),
      },
    });

  const [result] = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      gender: teacherProfiles.gender,
      bio: teacherProfiles.bio,
      interests: teacherProfiles.interests,
      teachingAreas: teacherProfiles.teachingAreas,
      teachingExperience: teacherProfiles.teachingExperience,
    })
    .from(user)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, user.id))
    .where(eq(user.id, session.user.id))
    .limit(1);

  return result;
});
