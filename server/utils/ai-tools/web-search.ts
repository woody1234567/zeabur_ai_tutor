import { z } from "zod";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  query: z.string().max(500).describe("搜尋查詢關鍵字"),
  topic: z
    .enum(["general", "news"])
    .default("general")
    .optional()
    .describe("搜尋類型：general（一般）或 news（新聞）"),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe("搜尋結果數量上限"),
});

export const webSearchTool = {
  name: "web_search",
  description:
    "搜尋網路上的資訊。適合用於查詢概念解釋、時事新聞、參考資料、或題庫中找不到的知識。回傳搜尋結果包含標題、網址與內容摘要。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args) => {
    const parsed = inputSchema.parse(args);
    const config = useRuntimeConfig();

    if (!config.tavilyApiKey) {
      return JSON.stringify({ error: "Web search is not configured" });
    }

    const response = await $fetch<{
      answer?: string;
      results: { title: string; url: string; content: string }[];
    }>("https://api.tavily.com/search", {
      method: "POST",
      body: {
        api_key: config.tavilyApiKey,
        query: parsed.query,
        topic: parsed.topic ?? "general",
        max_results: parsed.maxResults,
        include_answer: true,
      },
    });

    const formatted = {
      answer: response.answer,
      results: response.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };

    return JSON.stringify(formatted, null, 2);
  },
} satisfies AiToolDefinition;
