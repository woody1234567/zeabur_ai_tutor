import { and, eq } from "drizzle-orm";
import { parentStudents } from "../../../db/schema";
import { db } from "../../../db";
import { requireAuthSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody(event);
  const { parentId, studentId } = body;

  if (!parentId || !studentId) {
    throw createError({ statusCode: 400, statusMessage: "Missing parentId or studentId" });
  }

  const deleted = await db
    .delete(parentStudents)
    .where(
      and(eq(parentStudents.parentId, parentId), eq(parentStudents.studentId, studentId))
    )
    .returning();

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Relationship not found" });
  }

  return { success: true };
});
