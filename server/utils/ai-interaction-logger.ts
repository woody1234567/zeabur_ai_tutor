import type { FileUIPart, UIMessage } from "ai";
import { db } from "../../db";
import {
  aiInteractionLogs,
  type AiInteractionAttachment,
} from "../../db/schema";

export type AiInteractionEventType =
  | "user_message"
  | "assistant_message"
  | "tool_call";

export type AiInteractionStatus = "completed" | "aborted" | "error";

export interface AiInteractionLogEntry {
  eventKey: string;
  chatId: string;
  messageId?: string | null;
  toolCallId?: string | null;
  userId: string;
  userRole: "student" | "teacher";
  eventType: AiInteractionEventType;
  status?: AiInteractionStatus;
  content?: string | null;
  attachments?: AiInteractionAttachment[] | null;
  toolName?: string | null;
  toolInput?: unknown;
  toolOutput?: unknown;
  finishReason?: string | null;
  durationMs?: number | null;
  error?: string | null;
  classroomId?: string | null;
  projectId?: string | null;
  stepNumber?: number | null;
  modelId?: string | null;
}

export function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map(part => part.text)
    .join("");
}

export function getMessageAttachments(
  message: UIMessage,
): AiInteractionAttachment[] {
  return message.parts
    .filter((part): part is FileUIPart => part.type === "file")
    .map(part => ({
      url: part.url,
      mediaType: part.mediaType,
      ...(part.filename ? { filename: part.filename } : {}),
    }));
}

export function serializeInteractionValue(value: unknown): unknown {
  if (typeof value !== "string") return value ?? null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getInteractionError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function logAiInteraction(
  entry: AiInteractionLogEntry,
  options: { onConflict?: "update" | "ignore" } = {},
): Promise<boolean> {
  const values = {
    eventKey: entry.eventKey,
    chatId: entry.chatId,
    messageId: entry.messageId ?? null,
    toolCallId: entry.toolCallId ?? null,
    userId: entry.userId,
    userRole: entry.userRole,
    eventType: entry.eventType,
    status: entry.status ?? "completed",
    content: entry.content ?? null,
    attachments: entry.attachments?.length ? entry.attachments : null,
    toolName: entry.toolName ?? null,
    toolInput: entry.toolInput ?? null,
    toolOutput: entry.toolOutput ?? null,
    finishReason: entry.finishReason ?? null,
    durationMs: entry.durationMs ?? null,
    error: entry.error ?? null,
    classroomId: entry.classroomId ?? null,
    projectId: entry.projectId ?? null,
    stepNumber: entry.stepNumber ?? null,
    modelId: entry.modelId ?? null,
    updatedAt: new Date(),
  };

  try {
    const insert = db.insert(aiInteractionLogs).values(values);

    if (options.onConflict === "ignore") {
      await insert.onConflictDoNothing({ target: aiInteractionLogs.eventKey });
    } else {
      await insert.onConflictDoUpdate({
        target: aiInteractionLogs.eventKey,
        set: values,
      });
    }
    return true;
  } catch (error) {
    console.error("AI interaction log write failed", {
      eventKey: entry.eventKey,
      chatId: entry.chatId,
      eventType: entry.eventType,
      error: getInteractionError(error),
    });
    return false;
  }
}
