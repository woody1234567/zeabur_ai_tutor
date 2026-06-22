import { db } from "../../db";
import { aiToolLogs } from "../../db/schema";

export interface AiToolLogEntry {
  userId: string;
  userRole?: string;
  toolName: string;
  userMessage?: string;
  args?: Record<string, unknown>;
  result: string;
  durationMs: number;
  error?: string;
  classroomId?: string | null;
  projectId?: string | null;
}

function extractResultCount(toolName: string, result: string): number | null {
  if (toolName !== "search_problems" && toolName !== "recommend_materials") {
    return null;
  }
  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) return parsed.length;
  } catch {}
  return null;
}

function truncate(str: string, maxLen = 500): string {
  return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
}

export function logAiToolCall(entry: AiToolLogEntry): void {
  db.insert(aiToolLogs)
    .values({
      userId: entry.userId,
      userRole: entry.userRole,
      toolName: entry.toolName,
      userMessage: entry.userMessage
        ? truncate(entry.userMessage, 1000)
        : null,
      args: entry.args ?? null,
      resultSummary: truncate(entry.result),
      resultCount: extractResultCount(entry.toolName, entry.result),
      durationMs: entry.durationMs,
      error: entry.error ?? null,
      classroomId: entry.classroomId ?? null,
      projectId: entry.projectId ?? null,
    })
    .then(() => {})
    .catch((err) => {
      console.warn("Failed to log AI tool call:", err.message);
    });
}
