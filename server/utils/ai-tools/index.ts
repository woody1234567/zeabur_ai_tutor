import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { toOpenAITool, type AiToolDefinition, type AiToolContext } from "./types";
import { searchProblemsTool } from "./search-problems";
import { recommendMaterialsTool } from "./recommend-materials";
import { createProblemTool } from "./create-problem";

const studentTools: AiToolDefinition[] = [searchProblemsTool, recommendMaterialsTool];
const teacherTools: AiToolDefinition[] = [searchProblemsTool, createProblemTool];

export function getOpenAITools(role: "student" | "teacher" = "student"): ChatCompletionTool[] {
  const tools = role === "teacher" ? teacherTools : studentTools;
  return tools.map(toOpenAITool);
}

export async function executeAiTool(
  name: string,
  args: Record<string, unknown>,
  context: AiToolContext
): Promise<string> {
  const allTools = [
    ...new Map(
      [...studentTools, ...teacherTools].map((t) => [t.name, t])
    ).values(),
  ];
  const tool = allTools.find((t) => t.name === name);
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` });

  try {
    return await tool.handler(args, context);
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

