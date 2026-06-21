import { z } from "zod";
import { searchProblems } from "../problems";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  title: z.string().max(200).optional().describe("題目標題關鍵字"),
  source: z.string().max(200).optional().describe("來源（課本、考卷名稱）"),
  hashtag: z.string().max(100).optional().describe("標籤，如 #三角函數"),
  limit: z.number().int().min(1).max(20).default(10).describe("回傳數量上限"),
});

export const searchProblemsTool = {
  name: "search_problems",
  description:
    "搜尋題庫中的練習題。可依標題、來源、標籤篩選。用於學生想找特定主題的題目練習時。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args) => {
    const parsed = inputSchema.parse(args);
    const results = await searchProblems(parsed);
    return JSON.stringify(results, null, 2);
  },
} satisfies AiToolDefinition;
