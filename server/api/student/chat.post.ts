import { db } from "../../../db";
import { chatHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  const body = await readBody(event);
  const { message, chatId } = body;

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Message is required" });
  }

  // Load existing chat history from DB
  let messages: any[] = [];
  let currentChatId: string | null = chatId ?? null;
  let title = "New Chat";

  if (currentChatId) {
    const chat = await db.query.chatHistory.findFirst({
      where: eq(chatHistory.id, currentChatId),
    });
    if (chat) {
      messages = chat.messages as any[];
      title = chat.title || title;
    }
  }

  // Set SSE response headers
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");

  // Forward to Python microservice streaming endpoint
  const aiServiceBase = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");
  const pythonRes = await fetch(`${aiServiceBase}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      user_id: user.id,
      messages,
      classroom_id: body.classroomId ?? null,
    }),
  });

  if (!pythonRes.ok || !pythonRes.body) {
    throw createError({
      statusCode: 502,
      statusMessage: "AI service unavailable",
    });
  }

  const reader = pythonRes.body.getReader();
  const decoder = new TextDecoder();
  let finalContent = "";
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Save the completed conversation to DB
          const userMsg = { role: "user", content: message };
          const assistantMsg = { role: "assistant", content: finalContent };
          const updatedMessages = [...messages, userMsg, assistantMsg];

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
                title,
                messages: updatedMessages as any,
              })
              .returning({ id: chatHistory.id });
            currentChatId = newChat[0].id;

            // Send the chatId to the frontend as a final SSE event
            const chatIdEvent = `data: ${JSON.stringify({ type: "chat_id", chatId: currentChatId })}\n\n`;
            controller.enqueue(new TextEncoder().encode(chatIdEvent));
          }

          controller.close();
          break;
        }

        // Decode and parse SSE lines to intercept 'done' event
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "done") {
                finalContent = data.content ?? "";
              }
            } catch {
              // ignore malformed lines
            }
          }
        }

        // Forward raw bytes to frontend
        controller.enqueue(value);
      }
    },
  });

  return sendStream(event, stream);
});
