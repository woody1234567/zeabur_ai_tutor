import { db } from "../../../db";
import { chatHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { streamChat } from "../../utils/ai-chat";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  const body = await readBody(event);
  const { message, chatId, projectId, useWebSearch } = body;

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Message is required" });
  }

  // Inject MCP principal for tool auth
  event.context.mcpPrincipal = {
    id: user.id,
    email: user.email,
    role: user.role ?? "student",
    scope: "student" as const,
  };

  // Load existing chat history from DB
  let dbMessages: any[] = [];
  let currentChatId: string | null = chatId ?? null;
  let title = "New Chat";

  if (currentChatId) {
    const chat = await db.query.chatHistory.findFirst({
      where: eq(chatHistory.id, currentChatId),
    });
    if (chat) {
      dbMessages = chat.messages as any[];
      title = chat.title || title;
    }
  }

  // Convert DB messages to OpenAI format
  const history: ChatCompletionMessageParam[] = dbMessages
    .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Set SSE response headers
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");

  let finalContent = "";

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        for await (const chunk of streamChat({
          message,
          userId: user.id,
          history,
          classroomId: body.classroomId ?? null,
          projectId: projectId ?? null,
          useWebSearch: !!useWebSearch,
        })) {
          // Intercept done event to capture final content
          if (chunk.startsWith("data: ")) {
            try {
              const data = JSON.parse(chunk.slice(6).trim());
              if (data.type === "done") {
                finalContent = data.content ?? "";
              }
            } catch {}
          }

          controller.enqueue(new TextEncoder().encode(chunk));
        }

        // Save conversation to DB
        const userMsg = { role: "user", content: message };
        const assistantMsg = { role: "assistant", content: finalContent };
        const updatedMessages = [...dbMessages, userMsg, assistantMsg];

        if (!title || title === "New Chat") {
          title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
        }

        if (currentChatId) {
          await db
            .update(chatHistory)
            .set({ messages: updatedMessages as any, updatedAt: new Date() })
            .where(eq(chatHistory.id, currentChatId));
        } else {
          const newChat = await db
            .insert(chatHistory)
            .values({
              studentId: user.id,
              projectId: projectId ?? null,
              title,
              messages: updatedMessages as any,
            })
            .returning({ id: chatHistory.id });
          currentChatId = newChat[0]!.id;

          const chatIdEvent = `data: ${JSON.stringify({ type: "chat_id", chatId: currentChatId })}\n\n`;
          controller.enqueue(new TextEncoder().encode(chatIdEvent));
        }

        controller.close();
      } catch (e) {
        console.error("AI chat stream error:", e);
        const errorEvent = `data: ${JSON.stringify({ type: "done", content: "An error occurred while processing your request." })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorEvent));
        controller.close();
      }
    },
  });

  return sendStream(event, stream);
});
