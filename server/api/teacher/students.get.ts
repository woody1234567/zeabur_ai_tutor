import { user } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const students = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(eq(user.role, "student"));

  return students;
});
