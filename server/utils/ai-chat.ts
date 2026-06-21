import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getOpenAITools, executeAiTool } from "./ai-tools";
import type { AiToolContext } from "./ai-tools/types";

function buildSystemPrompt(userId: string, classroomId?: string | null): string {
  return `You are a helpful AI Tutor assistant.
Student ID: ${userId}
${classroomId ? `Classroom ID: ${classroomId}` : ""}

You can search for practice problems and recommend class materials.
Always respond in the same language the student uses.
When recommending resources, briefly explain why they're relevant.`;
}

export type StreamChatOptions = {
  message: string;
  userId: string;
  history: ChatCompletionMessageParam[];
  classroomId?: string | null;
};

export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<string> {
  const config = useRuntimeConfig();
  const client = new OpenAI({
    baseURL: config.aiBaseUrl,
    apiKey: config.aiApiKey || "",
  });

  const tools = getOpenAITools();
  const toolContext: AiToolContext = {
    userId: options.userId,
    classroomId: options.classroomId,
  };
  const systemPrompt = buildSystemPrompt(options.userId, options.classroomId);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...options.history,
    { role: "user", content: options.message },
  ];

  let fullContent = "";
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await client.chat.completions.create({
      model: config.aiModel,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      stream: true,
    });

    let roundContent = "";
    const toolCalls: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        roundContent += choice.delta.content;
        yield `data: ${JSON.stringify({ type: "token", content: choice.delta.content })}\n\n`;
      }

      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          const existing = toolCalls.get(tc.index);
          if (existing) {
            existing.arguments += tc.function?.arguments ?? "";
          } else {
            toolCalls.set(tc.index, {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              arguments: tc.function?.arguments ?? "",
            });
          }
        }
      }

      if (choice.finish_reason === "stop") {
        fullContent += roundContent;
        yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
        return;
      }

      if (choice.finish_reason === "tool_calls") {
        messages.push({
          role: "assistant",
          content: roundContent || null,
          tool_calls: Array.from(toolCalls.values()).map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        for (const tc of toolCalls.values()) {
          yield `data: ${JSON.stringify({ type: "tool_start", tool: tc.name })}\n\n`;

          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.arguments);
          } catch {}

          const result = await executeAiTool(tc.name, parsedArgs, toolContext);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });

          yield `data: ${JSON.stringify({ type: "tool_result", tool: tc.name })}\n\n`;
        }

        fullContent += roundContent;
        break;
      }
    }

    if (toolCalls.size === 0) {
      fullContent += roundContent;
      yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
      return;
    }
  }

  yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
}
