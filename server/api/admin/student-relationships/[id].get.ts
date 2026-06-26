import { eq } from "drizzle-orm";
import { parentStudents, user } from "../../../../db/schema";
import { db } from "../../../../db";
import { requireAuthSession } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const studentId = getRouterParam(event, "id");
  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: "Missing student id" });
  }

  const [student] = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, studentId))
    .limit(1);

  if (!student) {
    throw createError({ statusCode: 404, statusMessage: "Student not found" });
  }

  const parents = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      linkedAt: parentStudents.createdAt,
    })
    .from(parentStudents)
    .innerJoin(user, eq(parentStudents.parentId, user.id))
    .where(eq(parentStudents.studentId, studentId));

  return { student, parents };
});
