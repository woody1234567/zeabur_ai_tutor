import { db } from "../../../db";
import { teacherChatHistory } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { createChatStream } from "../../utils/ai-chat";
import {
  logAssistantChatError,
  logAssistantChatMessage,
  logUserChatMessage,
  reconcileToolCallsFromMessage,
} from "../../utils/ai-chat-interactions";
import { getInteractionError } from "../../utils/ai-interaction-logger";
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

  const latestUserMessage = clientMessages.findLast(message => message.role === "user");
  if (!latestUserMessage) {
    throw createError({ statusCode: 400, statusMessage: "A user message is required" });
  }

  const interactionContext = {
    chatId,
    userId: user.id,
    userRole: "teacher" as const,
    projectId: projectId ?? null,
  };

  await logUserChatMessage(interactionContext, latestUserMessage);

  const existingChat = await db.query.teacherChatHistory.findFirst({
    where: and(
      eq(teacherChatHistory.id, chatId),
      eq(teacherChatHistory.teacherId, user.id),
    ),
  });

  let result;
  try {
    result = await createChatStream({
      messages: clientMessages,
      chatId,
      userId: user.id,
      role: "teacher",
      projectId: projectId ?? null,
      useWebSearch: !!useWebSearch,
    });
  } catch (error) {
    await logAssistantChatError(interactionContext, latestUserMessage.id, error);
    throw error;
  }

  const firstUserText = clientMessages
    .find(m => m.role === "user")
    ?.parts?.find((p): p is { type: "text"; text: string } => p.type === "text")
    ?.text ?? "New Chat";

  let streamError: string | null = null;
  const response = result.toUIMessageStreamResponse({
    originalMessages: clientMessages,
    onError: (error) => {
      streamError = getInteractionError(error);
      console.error("Teacher AI chat stream failed", { chatId, error: streamError });
      return "An error occurred.";
    },
    onFinish: async ({
      messages: finalMessages,
      responseMessage,
      isAborted,
      finishReason,
    }) => {
      const title = existingChat?.title || firstUserText.substring(0, 50) + (firstUserText.length > 50 ? "..." : "");

      const persistHistory = existingChat
        ? db
            .update(teacherChatHistory)
            .set({ messages: finalMessages as any, updatedAt: new Date() })
            .where(eq(teacherChatHistory.id, chatId))
        : db.insert(teacherChatHistory).values({
            id: chatId,
            teacherId: user.id,
            projectId: projectId ?? null,
            title,
            messages: finalMessages as any,
          });

      const status = isAborted
        ? "aborted"
        : streamError || finishReason === "error"
          ? "error"
          : "completed";

      await Promise.all([
        persistHistory,
        logAssistantChatMessage(
          interactionContext,
          latestUserMessage.id,
          responseMessage,
          {
            status,
            finishReason: finishReason ?? null,
            error: streamError,
          },
        ),
        reconcileToolCallsFromMessage(interactionContext, responseMessage),
      ]);
    },
  });

  return sendWebResponse(event, response);
});
