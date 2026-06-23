import { z } from "zod";
import { tool } from "ai";
import { searchProblems } from "../problems";
import type { AiToolContext } from "./types";

const inputSchema = z.object({
  query: z.string().max(500).optional().describe("語意搜尋，用自然語言描述想找的題目類型或概念（如：「計算三角形面積的應用題」）"),
  title: z.string().max(200).optional().describe("題目標題或內容關鍵字"),
  source: z.string().max(200).optional().describe("來源（課本、考卷名稱）"),
  hashtag: z.string().max(100).optional().describe("標籤，如 #三角函數"),
  subject: z.string().max(100).optional().describe("科目，如 數學、英文、物理"),
  chapter: z.string().max(200).optional().describe("章節，如 第三章、二次方程式"),
  grade: z.string().max(50).optional().describe("年級，如 國一、高二"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("難度"),
  testbankId: z.string().max(100).optional().describe("題庫 ID，限制搜尋範圍至特定題庫"),
  limit: z.number().int().min(1).max(20).default(10).describe("回傳數量上限"),
});

export const searchProblemsTool = tool({
  description:
    "搜尋題庫中的練習題。支援語意搜尋（用自然語言描述想找什麼）以及關鍵字、科目、章節、年級、難度、來源、標籤篩選。用於學生想找特定主題的題目練習時。",
  inputSchema,
  execute: async (input) => {
    const results = await searchProblems(input);
    return JSON.stringify(results, null, 2);
  },
});
