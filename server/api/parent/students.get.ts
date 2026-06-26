import { defineEventHandler } from "h3";
import { db } from "../../../db";
import { parentStudents, user } from "../../../db/schema";
import { requireAuthSession } from "../../utils/auth";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "parent") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  console.log("Fetching students for parent:", session.user.id);

  const students = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(parentStudents)
    .innerJoin(user, eq(parentStudents.studentId, user.id))
    .where(eq(parentStudents.parentId, session.user.id));

  console.log("Found students:", students);

  return students;
});
