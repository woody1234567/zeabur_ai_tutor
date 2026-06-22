import { db } from "../../../../db";
import { teacherChatHistory } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  const id = getRouterParam(event, "id");

  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Chat ID is required" });
  }

  const chat = await db.query.teacherChatHistory.findFirst({
    where: and(
      eq(teacherChatHistory.id, id),
      eq(teacherChatHistory.teacherId, user.id),
    ),
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: "Chat not found" });
  }

  return chat;
});
