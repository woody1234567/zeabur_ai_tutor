import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getOpenAITools, executeAiTool } from "./ai-tools";
import type { AiToolContext } from "./ai-tools/types";

function buildStudentSystemPrompt(userId: string, classroomId?: string | null): string {
  return `You are a helpful AI Tutor assistant.
Student ID: ${userId}
${classroomId ? `Classroom ID: ${classroomId}` : ""}

You can search for practice problems and recommend class materials.
Always respond in the same language the student uses.
When recommending resources, briefly explain why they're relevant.`;
}

function buildTeacherSystemPrompt(userId: string): string {
  return `You are an AI assistant that helps teachers create and manage exam problems.
Teacher ID: ${userId}

Your capabilities:
- Search existing problems in the question bank for reference or to avoid duplicates.
- Create new multiple-choice problems and save them to the database.

Workflow:
1. Discuss the problem topic, content, and difficulty with the teacher.
2. Help draft the question stem, choices, correct answer, and explanation.
3. Only call the create_problem tool AFTER the teacher confirms the problem content is ready.
4. After creating, report the result and ask if they want to create more.

Always respond in the same language the teacher uses.
When drafting problems, use clear and precise language suitable for the target grade level.`;
}

export type StreamChatOptions = {
  message: string;
  userId: string;
  history: ChatCompletionMessageParam[];
  classroomId?: string | null;
  role?: "student" | "teacher";
};

export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<string> {
  const config = useRuntimeConfig();
  const client = new OpenAI({
    baseURL: config.aiBaseUrl,
    apiKey: config.aiApiKey || "",
  });

  const role = options.role ?? "student";
  const tools = getOpenAITools(role);
  const toolContext: AiToolContext = {
    userId: options.userId,
    classroomId: options.classroomId,
  };
  const systemPrompt = role === "teacher"
    ? buildTeacherSystemPrompt(options.userId)
    : buildStudentSystemPrompt(options.userId, options.classroomId);

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
