import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (
    args: Record<string, unknown>,
    context: AiToolContext
  ) => Promise<string>;
}

export interface AiToolContext {
  userId: string;
  classroomId?: string | null;
}

export function toOpenAITool(def: AiToolDefinition): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: def.name,
      description: def.description,
      parameters: def.parameters,
    },
  };
}
