import { user } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || session.user.role !== "student") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const teachers = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(eq(user.role, "teacher"));

  return teachers;
});
