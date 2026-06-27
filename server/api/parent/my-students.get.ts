import { user, parentStudents } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "parent") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const parentId = session.user.id;

  const students = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .innerJoin(parentStudents, eq(user.id, parentStudents.studentId))
    .where(eq(parentStudents.parentId, parentId));

  return students;
});
