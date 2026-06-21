import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { toOpenAITool, type AiToolDefinition, type AiToolContext } from "./types";
import { searchProblemsTool } from "./search-problems";
import { recommendMaterialsTool } from "./recommend-materials";

const aiTools: AiToolDefinition[] = [searchProblemsTool, recommendMaterialsTool];

export function getOpenAITools(): ChatCompletionTool[] {
  return aiTools.map(toOpenAITool);
}

export async function executeAiTool(
  name: string,
  args: Record<string, unknown>,
  context: AiToolContext
): Promise<string> {
  const tool = aiTools.find((t) => t.name === name);
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` });

  try {
    return await tool.handler(args, context);
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

