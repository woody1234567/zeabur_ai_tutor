import { problemLists } from "../../../../db/schema";
import { requireAuthSession } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody(event);
  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }

  const [created] = await useDrizzle()
    .insert(problemLists)
    .values({
      ownerId: session.user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
    })
    .returning();

  return created;
});
