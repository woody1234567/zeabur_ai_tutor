import type { OnToolCallFinishEvent } from "ai";
import {
  getInteractionError,
  logAiInteraction,
  serializeInteractionValue,
} from "./ai-interaction-logger";

export async function recordAiToolCall(
  event: OnToolCallFinishEvent,
): Promise<void> {
  const metadata = event.metadata ?? {};
  const userId = String(metadata.userId ?? "");
  const userRole = String(metadata.userRole ?? "") as "student" | "teacher";
  const chatId = String(metadata.chatId ?? "");
  const classroomId = metadata.classroomId
    ? String(metadata.classroomId)
    : null;
  const projectId = metadata.projectId ? String(metadata.projectId) : null;

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
