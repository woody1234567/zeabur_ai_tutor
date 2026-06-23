import { testbanks } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const { name, description, isPublic } = await readBody(event);

  if (!name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  const [created] = await useDrizzle()
    .insert(testbanks)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: session.user.id,
      isPublic: isPublic ?? true,
    })
    .returning();

  return created;
});
