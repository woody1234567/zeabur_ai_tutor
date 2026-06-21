import { db } from "../../../../db";
import { teacherChatHistory } from "../../../../db/schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;

  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const chats = await db
    .select({
      id: teacherChatHistory.id,
      title: teacherChatHistory.title,
      createdAt: teacherChatHistory.createdAt,
      updatedAt: teacherChatHistory.updatedAt,
    })
    .from(teacherChatHistory)
    .where(eq(teacherChatHistory.teacherId, user.id))
    .orderBy(desc(teacherChatHistory.updatedAt));

  return chats;
});
