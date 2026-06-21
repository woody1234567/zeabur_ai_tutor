import { z } from "zod";
import { searchProblems } from "../problems";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  title: z.string().max(200).optional().describe("題目標題或內容關鍵字"),
  source: z.string().max(200).optional().describe("來源（課本、考卷名稱）"),
  hashtag: z.string().max(100).optional().describe("標籤，如 #三角函數"),
  subject: z.string().max(100).optional().describe("科目，如 數學、英文、物理"),
  chapter: z.string().max(200).optional().describe("章節，如 第三章、二次方程式"),
  grade: z.string().max(50).optional().describe("年級，如 國一、高二"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("難度"),
  limit: z.number().int().min(1).max(20).default(10).describe("回傳數量上限"),
});

export const searchProblemsTool = {
  name: "search_problems",
  description:
    "搜尋題庫中的練習題。可依標題/內容關鍵字、科目、章節、年級、難度、來源、標籤篩選。用於學生想找特定主題的題目練習時。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args) => {
    const parsed = inputSchema.parse(args);
    const results = await searchProblems(parsed);
    return JSON.stringify(results, null, 2);
  },
} satisfies AiToolDefinition;
