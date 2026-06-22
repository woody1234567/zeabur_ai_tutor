import { db } from "../../../db";
import { chatHistory } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { createChatStream } from "../../utils/ai-chat";
import type { UIMessage } from "ai";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  const body = await readBody(event);
  const {
    messages: clientMessages,
    chatId,
    projectId,
    classroomId,
    useWebSearch,
  } = body as {
    messages: UIMessage[];
    chatId: string;
    projectId?: string;
    classroomId?: string;
    useWebSearch?: boolean;
  };

  if (!clientMessages?.length) {
    throw createError({ statusCode: 400, statusMessage: "Messages are required" });
  }
  if (!chatId) {
    throw createError({ statusCode: 400, statusMessage: "chatId is required" });
  }

  const existingChat = await db.query.chatHistory.findFirst({
    where: and(eq(chatHistory.id, chatId), eq(chatHistory.studentId, user.id)),
  });

  const result = await createChatStream({
    messages: clientMessages,
    userId: user.id,
    classroomId: classroomId ?? null,
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
          .update(chatHistory)
          .set({ messages: finalMessages as any, updatedAt: new Date() })
          .where(eq(chatHistory.id, chatId));
      } else {
        await db.insert(chatHistory).values({
          id: chatId,
          studentId: user.id,
          projectId: projectId ?? null,
          title,
          messages: finalMessages as any,
        });
      }
    },
  });

  return sendWebResponse(event, response);
});
