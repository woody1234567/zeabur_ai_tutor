import { getToolName, isToolUIPart, type UIMessage } from "ai";
import {
  getInteractionError,
  getMessageAttachments,
  getMessageContent,
  logAiInteraction,
  type AiInteractionStatus,
  serializeInteractionValue,
} from "./ai-interaction-logger";

export interface AiChatInteractionContext {
  chatId: string;
  userId: string;
  userRole: "student" | "teacher";
  classroomId?: string | null;
  projectId?: string | null;
}

export async function logUserChatMessage(
  context: AiChatInteractionContext,
  message: UIMessage,
): Promise<boolean> {
  return logAiInteraction({
    eventKey: `message:${context.chatId}:user:${message.id}`,
    chatId: context.chatId,
    messageId: message.id,
    userId: context.userId,
    userRole: context.userRole,
    eventType: "user_message",
    content: getMessageContent(message),
    attachments: getMessageAttachments(message),
    classroomId: context.classroomId,
    projectId: context.projectId,
  });
}

export async function logAssistantChatMessage(
  context: AiChatInteractionContext,
  requestMessageId: string,
  message: UIMessage,
  options: {
    status: AiInteractionStatus;
    finishReason?: string | null;
    error?: string | null;
  },
): Promise<boolean> {
  const content = getMessageContent(message);
  const attachments = getMessageAttachments(message);

  if (!content && attachments.length === 0 && options.status === "completed") {
    return true;
  }

  return logAiInteraction({
    eventKey: `message:${context.chatId}:assistant:${requestMessageId}:${message.id}`,
    chatId: context.chatId,
    messageId: message.id,
    userId: context.userId,
    userRole: context.userRole,
    eventType: "assistant_message",
    status: options.status,
    content,
    attachments,
    finishReason: options.finishReason,
    error: options.error,
    classroomId: context.classroomId,
    projectId: context.projectId,
  });
}

export async function logAssistantChatError(
  context: AiChatInteractionContext,
  requestMessageId: string,
  error: unknown,
): Promise<boolean> {
  return logAiInteraction({
    eventKey: `message:${context.chatId}:assistant-error:${requestMessageId}`,
    chatId: context.chatId,
    userId: context.userId,
    userRole: context.userRole,
    eventType: "assistant_message",
    status: "error",
    error: getInteractionError(error),
    classroomId: context.classroomId,
    projectId: context.projectId,
  });
}

export async function reconcileToolCallsFromMessage(
  context: AiChatInteractionContext,
  message: UIMessage,
): Promise<void> {
  let stepNumber = -1;
  const writes: Promise<boolean>[] = [];

  for (const part of message.parts) {
    if (part.type === "step-start") {
      stepNumber++;
      continue;
    }

    if (!isToolUIPart(part)) continue;
    if (part.state !== "output-available" && part.state !== "output-error") {
      continue;
    }

    console.info("Reconciling AI tool call from response message", {
      chatId: context.chatId,
      toolCallId: part.toolCallId,
      toolName: getToolName(part),
      state: part.state,
    });

    writes.push(
      logAiInteraction(
        {
          eventKey: `tool:${context.chatId}:${part.toolCallId}`,
          chatId: context.chatId,
          toolCallId: part.toolCallId,
          userId: context.userId,
          userRole: context.userRole,
          eventType: "tool_call",
          status: part.state === "output-available" ? "completed" : "error",
          toolName: getToolName(part),
          toolInput: part.input ?? null,
          toolOutput: part.state === "output-available"
            ? serializeInteractionValue(part.output)
            : null,
          error: part.state === "output-error" ? part.errorText : null,
          classroomId: context.classroomId,
          projectId: context.projectId,
          stepNumber: stepNumber >= 0 ? stepNumber : null,
        },
        { onConflict: "ignore" },
      ),
    );
  }

  await Promise.all(writes);
}
