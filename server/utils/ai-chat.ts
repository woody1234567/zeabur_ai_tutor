import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getOpenAITools, executeAiTool } from "./ai-tools";
import type { AiToolContext } from "./ai-tools/types";
import { db } from "../../db";
import { chatProjects } from "../../db/schema";
import { eq } from "drizzle-orm";

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
- Recognize and extract problem content from uploaded images (exam papers, textbook photos, etc.).

Workflow:
1. If the teacher uploads an image, carefully recognize all text, choices, diagrams, and tables in the image. Present the extracted content clearly.
2. Discuss the problem topic, content, and difficulty with the teacher.
3. Help draft the question stem, choices, correct answer, and detailed explanation.
4. Check if all required information is available: title, question stem, choices, correct answer. If any of chapter, difficulty, grade, or subject is missing, proactively ask the teacher.
5. Ask the teacher whether the problem requires an image to fully express its meaning (e.g., geometric figures, charts, diagrams, graphs). If yes, ask the teacher to upload the content image. When the teacher uploads the content image, remember its URL to include as the imageUrl parameter when creating the problem.
6. Present the complete problem draft in a structured format for the teacher to review.
7. Only call the create_problem tool AFTER the teacher explicitly confirms the problem content is ready. Include the imageUrl parameter if the teacher uploaded a content image for the problem.
8. After creating, report the result and ask if they want to create more.

Always respond in the same language the teacher uses.
When drafting problems, use clear and precise language suitable for the target grade level.`;
}

export type StreamChatOptions = {
  message: string;
  imageUrl?: string;
  userId: string;
  history: ChatCompletionMessageParam[];
  classroomId?: string | null;
  role?: "student" | "teacher";
  projectId?: string | null;
  useWebSearch?: boolean;
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
  let systemPrompt = role === "teacher"
    ? buildTeacherSystemPrompt(options.userId)
    : buildStudentSystemPrompt(options.userId, options.classroomId);

  if (options.projectId) {
    const project = await db.query.chatProjects.findFirst({
      where: eq(chatProjects.id, options.projectId),
    });
    if (project?.systemPrompt) {
      systemPrompt += `\n\n--- Project Instructions ---\n${project.systemPrompt}`;
    }
  }

  if (options.useWebSearch) {
    systemPrompt += `\n\nThe user has requested a web search. You MUST use the web_search tool at least once to answer this query. Search the web first, then incorporate the results into your response.`;
  }

  const userContent: ChatCompletionMessageParam["content"] = options.imageUrl
    ? [
        { type: "text" as const, text: options.message },
        { type: "image_url" as const, image_url: { url: options.imageUrl, detail: "high" as const } },
      ]
    : options.message;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...options.history,
    { role: "user", content: userContent },
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

          const startTime = Date.now();
          let result: string;
          let toolError: string | undefined;

          try {
            result = await executeAiTool(tc.name, parsedArgs, toolContext);
          } catch (err: any) {
            toolError = err.message;
            result = JSON.stringify({ error: err.message });
          }

          const durationMs = Date.now() - startTime;

          logAiToolCall({
            userId: options.userId,
            userRole: role,
            toolName: tc.name,
            userMessage: options.message,
            args: parsedArgs,
            result,
            durationMs,
            error: toolError,
            classroomId: options.classroomId,
            projectId: options.projectId,
          });

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
