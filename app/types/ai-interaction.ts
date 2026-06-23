export type AiInteractionEventType =
  | "user_message"
  | "assistant_message"
  | "tool_call";

export type AiInteractionStatus = "completed" | "aborted" | "error";

export interface AiInteractionAttachment {
  url: string;
  mediaType: string;
  filename?: string;
}

export interface AiInteractionLog {
  id: string;
  eventKey: string;
  chatId: string;
  messageId: string | null;
  toolCallId: string | null;
  userId: string;
  userName: string | null;
  userRole: string;
  eventType: AiInteractionEventType;
  status: AiInteractionStatus;
  content: string | null;
  attachments: AiInteractionAttachment[] | null;
  toolName: string | null;
  toolInput: unknown;
  toolOutput: unknown;
  finishReason: string | null;
  durationMs: number | null;
  error: string | null;
  classroomId: string | null;
  projectId: string | null;
  stepNumber: number | null;
  modelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiInteractionLogsResponse {
  logs: AiInteractionLog[];
  total: number;
  limit: number;
  offset: number;
}
