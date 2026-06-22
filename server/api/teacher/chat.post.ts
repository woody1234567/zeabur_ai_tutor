import { db } from "../../../db";
import { teacherChatHistory } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { createChatStream } from "../../utils/ai-chat";
import type { UIMessage } from "ai";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;

  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody(event);
  const {
    messages: clientMessages,
    chatId,
    projectId,
    useWebSearch,
  } = body as {
    messages: UIMessage[];
    chatId: string;
    projectId?: string;
    useWebSearch?: boolean;
  };

  if (!clientMessages?.length) {
    throw createError({ statusCode: 400, statusMessage: "Messages are required" });
  }
  if (!chatId) {
    throw createError({ statusCode: 400, statusMessage: "chatId is required" });
  }

  const existingChat = await db.query.teacherChatHistory.findFirst({
    where: and(
      eq(teacherChatHistory.id, chatId),
      eq(teacherChatHistory.teacherId, user.id),
    ),
  });

  const result = await createChatStream({
    messages: clientMessages,
    userId: user.id,
    role: "teacher",
    projectId: projectId ?? null,
    useWebSearch: !!useWebSearch,
  });

  const firstUserText = clientMessages
    .find(m => m.role === "user")
    ?.parts?.find((p): p is { type: "text"; text: string } => p.type === "text")
    ?.text ?? "New Chat";

  const response = result.toUIMessageStreamResponse({
    originalMessages: clientMessages,
    onFinish: async ({ messages: finalMessages }) => {
      const title = existingChat?.title || firstUserText.substring(0, 50) + (firstUserText.length > 50 ? "..." : "");

      if (existingChat) {
        await db
          .update(teacherChatHistory)
          .set({ messages: finalMessages as any, updatedAt: new Date() })
          .where(eq(teacherChatHistory.id, chatId));
      } else {
        await db.insert(teacherChatHistory).values({
          id: chatId,
          teacherId: user.id,
          projectId: projectId ?? null,
          title,
          messages: finalMessages as any,
        });
      }
    },
  });

  return sendWebResponse(event, response);
});
