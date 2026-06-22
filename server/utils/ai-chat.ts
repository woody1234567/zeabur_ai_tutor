import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { getAIModel } from "./ai-provider";
import { getTools } from "./ai-tools";
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
  messages: UIMessage[];
  userId: string;
  classroomId?: string | null;
  role?: "student" | "teacher";
  projectId?: string | null;
  useWebSearch?: boolean;
};

export async function createChatStream(options: StreamChatOptions) {
  const model = await getAIModel();
  const role = options.role ?? "student";
  const tools = getTools(role);
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

  const modelMessages = await convertToModelMessages(options.messages);

  return streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    experimental_context: toolContext,
    experimental_onToolCallFinish(event) {
      const lastUserMsg = options.messages.findLast(m => m.role === "user");
      const userText = lastUserMsg?.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map(p => p.text)
        .join(" ") ?? "";

      logAiToolCall({
        userId: options.userId,
        userRole: role,
        toolName: event.toolCall.toolName,
        userMessage: userText,
        args: event.toolCall.input as Record<string, unknown>,
        result: event.success ? String(event.output) : JSON.stringify({ error: String(event.error) }),
        durationMs: event.durationMs,
        error: event.success ? undefined : String(event.error),
        classroomId: options.classroomId,
        projectId: options.projectId,
      });
    },
  });
}
