import type { OnToolCallFinishEvent } from "ai";
import type { AiToolContext } from "./ai-tools/types";
import {
  getInteractionError,
  logAiInteraction,
  serializeInteractionValue,
} from "./ai-interaction-logger";

export async function recordAiToolCall(
  event: OnToolCallFinishEvent,
): Promise<void> {
  const metadata = event.metadata ?? {};
  const context = (event.experimental_context ?? {}) as Partial<AiToolContext>;
  const userId = String(context.userId ?? metadata.userId ?? "");
  const userRole = String(
    context.userRole ?? metadata.userRole ?? "",
  ) as "student" | "teacher";
  const chatId = String(context.chatId ?? metadata.chatId ?? "");
  const classroomValue = context.classroomId ?? metadata.classroomId;
  const projectValue = context.projectId ?? metadata.projectId;
  const classroomId = classroomValue
    ? String(classroomValue)
    : null;
  const projectId = projectValue ? String(projectValue) : null;

  if (!userId || !chatId || !["student", "teacher"].includes(userRole)) {
    console.error("AI tool callback metadata is incomplete", {
      toolCallId: event.toolCall.toolCallId,
      userId,
      userRole,
      chatId,
    });
    return;
  }

  console.info("AI tool call finished", {
    chatId,
    toolCallId: event.toolCall.toolCallId,
    toolName: event.toolCall.toolName,
    success: event.success,
    durationMs: event.durationMs,
  });

  await logAiInteraction({
    eventKey: `tool:${chatId}:${event.toolCall.toolCallId}`,
    chatId,
    toolCallId: event.toolCall.toolCallId,
    userId,
    userRole,
    eventType: "tool_call",
    status: event.success ? "completed" : "error",
    toolName: event.toolCall.toolName,
    toolInput: event.toolCall.input,
    toolOutput: event.success
      ? serializeInteractionValue(event.output)
      : null,
    durationMs: event.durationMs,
    error: event.success ? null : getInteractionError(event.error),
    classroomId,
    projectId,
    stepNumber: event.stepNumber ?? null,
    modelId: event.model?.modelId ?? null,
  });
}
