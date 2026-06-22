import { db } from "../../../db";
import { teacherChatHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { streamChat } from "../../utils/ai-chat";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;

  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody(event);
  const { message, chatId, imageUrl, projectId } = body;

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Message is required" });
  }

  let dbMessages: any[] = [];
  let currentChatId: string | null = chatId ?? null;
  let title = "New Chat";

  if (currentChatId) {
    const chat = await db.query.teacherChatHistory.findFirst({
      where: eq(teacherChatHistory.id, currentChatId),
    });
    if (chat) {
      dbMessages = chat.messages as any[];
      title = chat.title || title;
    }
  }

  const history: ChatCompletionMessageParam[] = dbMessages
    .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
    .map((m) => {
      if (m.role === "user" && m.imageUrl) {
        return {
          role: "user" as const,
          content: [
            { type: "text" as const, text: m.content },
            { type: "image_url" as const, image_url: { url: m.imageUrl, detail: "high" as const } },
          ],
        };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");

  let finalContent = "";

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        for await (const chunk of streamChat({
          message,
          imageUrl,
          userId: user.id,
          history,
          role: "teacher",
          projectId: projectId ?? null,
        })) {
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

        const userMsg = { role: "user", content: message, ...(imageUrl && { imageUrl }) };
        const assistantMsg = { role: "assistant", content: finalContent };
        const updatedMessages = [...dbMessages, userMsg, assistantMsg];

        if (!title || title === "New Chat") {
          title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
        }

        if (currentChatId) {
          await db
            .update(teacherChatHistory)
            .set({ messages: updatedMessages as any, updatedAt: new Date() })
            .where(eq(teacherChatHistory.id, currentChatId));
        } else {
          const newChat = await db
            .insert(teacherChatHistory)
            .values({
              teacherId: user.id,
              projectId: projectId ?? null,
              title,
              messages: updatedMessages as any,
            })
            .returning({ id: teacherChatHistory.id });
          currentChatId = newChat[0]!.id;

          const chatIdEvent = `data: ${JSON.stringify({ type: "chat_id", chatId: currentChatId })}\n\n`;
          controller.enqueue(new TextEncoder().encode(chatIdEvent));
        }

        controller.close();
      } catch (e) {
        console.error("Teacher AI chat stream error:", e);
        const errorEvent = `data: ${JSON.stringify({ type: "done", content: "An error occurred while processing your request." })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorEvent));
        controller.close();
      }
    },
  });

  return sendStream(event, stream);
});
