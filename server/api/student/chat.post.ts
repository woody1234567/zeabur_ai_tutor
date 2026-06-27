import { chatHistory } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { createChatStream } from "../../utils/ai-chat";
import {
  logAssistantChatError,
  logAssistantChatMessage,
  logUserChatMessage,
  reconcileToolCallsFromMessage,
} from "../../utils/ai-chat-interactions";
import {
  getElapsedDurationMs,
  getInteractionError,
} from "../../utils/ai-interaction-logger";
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
    toolkits,
  } = body as {
    messages: UIMessage[];
    chatId: string;
    projectId?: string;
    classroomId?: string;
    useWebSearch?: boolean;
    toolkits?: string[];
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
    userRole: "student" as const,
    classroomId: classroomId ?? null,
    projectId: projectId ?? null,
  };

  await logUserChatMessage(interactionContext, latestUserMessage);

  const existingChat = await useDrizzle().query.chatHistory.findFirst({
    where: and(eq(chatHistory.id, chatId), eq(chatHistory.studentId, user.id)),
  });

  const assistantStartedAt = performance.now();
  let result;
  try {
    result = await createChatStream({
      messages: clientMessages,
      chatId,
      userId: user.id,
      classroomId: classroomId ?? null,
      projectId: projectId ?? null,
      useWebSearch: !!useWebSearch,
      toolkits: Array.isArray(toolkits) ? toolkits : [],
    });
  } catch (error) {
    await logAssistantChatError(
      interactionContext,
      latestUserMessage.id,
      error,
      getElapsedDurationMs(assistantStartedAt),
    );
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
      console.error("Student AI chat stream failed", { chatId, error: streamError });
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
        ? useDrizzle()
            .update(chatHistory)
            .set({ messages: finalMessages as any, updatedAt: new Date() })
            .where(eq(chatHistory.id, chatId))
        : useDrizzle().insert(chatHistory).values({
            id: chatId,
            studentId: user.id,
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
            durationMs: getElapsedDurationMs(assistantStartedAt),
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
