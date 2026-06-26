import { user, studentProfiles } from "../../../../db/schema";
import { eq } from "drizzle-orm";

interface UpdateProfileBody {
  name?: string;
  gender?: string | null;
  bio?: string | null;
  interests?: string | null;
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || (session.user.role !== "student" && session.user.role !== "admin")) {
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

  await useDrizzle()
    .update(user)
    .set({ name: body.name.trim(), updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  await useDrizzle()
    .insert(studentProfiles)
    .values({
      userId: session.user.id,
      gender: body.gender || null,
      bio: body.bio || null,
      interests: body.interests || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: studentProfiles.userId,
      set: {
        gender: body.gender || null,
        bio: body.bio || null,
        interests: body.interests || null,
        updatedAt: new Date(),
      },
    });

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
