import OpenAI from "openai";
import { z } from "zod";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

import searchProblemsDef from "../mcp/tools/search_problems";
import recommendMaterialsDef from "../mcp/tools/recommend_materials";

type McpToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
  handler: (args: any) => Promise<any>;
};

const studentToolDefs: McpToolDef[] = [
  searchProblemsDef as unknown as McpToolDef,
  recommendMaterialsDef as unknown as McpToolDef,
];

function buildOpenAITools(defs: McpToolDef[]): ChatCompletionTool[] {
  return defs.map((def) => {
    const { $schema, ...parameters } = z.toJSONSchema(z.object(def.inputSchema));
    return {
      type: "function" as const,
      function: {
        name: def.name,
        description: def.description,
        parameters,
      },
    };
  });
}

function buildSystemPrompt(userId: string, classroomId?: string | null): string {
  return `You are a helpful AI Tutor assistant.
Student ID: ${userId}
${classroomId ? `Classroom ID: ${classroomId}` : ""}

You can:
- Search for practice problems (use search_problems tool)
- Recommend class materials (use recommend_materials tool)
- Explain concepts and problem solutions in detail
- Answer questions about course content

Always respond in the same language the student uses.
When recommending resources, briefly explain why they're relevant.`;
}

async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const def = studentToolDefs.find((d) => d.name === toolName);
  if (!def) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  try {
    const result = await def.handler(args);
    if (typeof result === "string") return result;
    if (result?.content) {
      return result.content
        .map((c: any) => c.text ?? JSON.stringify(c))
        .join("\n");
    }
    return JSON.stringify(result);
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export type StreamChatOptions = {
  message: string;
  userId: string;
  history: ChatCompletionMessageParam[];
  classroomId?: string | null;
};

export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<string> {
  const config = useRuntimeConfig();
  const client = new OpenAI({
    baseURL: config.aiBaseUrl,
    apiKey: config.aiApiKey || "",
  });

  const tools = buildOpenAITools(studentToolDefs);
  const systemPrompt = buildSystemPrompt(options.userId, options.classroomId);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...options.history,
    { role: "user", content: options.message },
  ];

  let fullContent = "";
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await client.chat.completions.create({
      model: config.aiModel,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      stream: true,
    });

    let roundContent = "";
    const toolCalls: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        roundContent += choice.delta.content;
        yield `data: ${JSON.stringify({ type: "token", content: choice.delta.content })}\n\n`;
      }

      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          const existing = toolCalls.get(tc.index);
          if (existing) {
            existing.arguments += tc.function?.arguments ?? "";
          } else {
            toolCalls.set(tc.index, {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              arguments: tc.function?.arguments ?? "",
            });
          }
        }
      }

      if (choice.finish_reason === "stop") {
        fullContent += roundContent;
        yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
        return;
      }

      if (choice.finish_reason === "tool_calls") {
        messages.push({
          role: "assistant",
          content: roundContent || null,
          tool_calls: Array.from(toolCalls.values()).map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        for (const tc of toolCalls.values()) {
          yield `data: ${JSON.stringify({ type: "tool_start", tool: tc.name })}\n\n`;

          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.arguments);
          } catch {}

          const result = await executeTool(tc.name, parsedArgs);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });

          yield `data: ${JSON.stringify({ type: "tool_result", tool: tc.name })}\n\n`;
        }

        fullContent += roundContent;
        break;
      }
    }

    if (toolCalls.size === 0) {
      fullContent += roundContent;
      yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
      return;
    }
  }

  yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
}
