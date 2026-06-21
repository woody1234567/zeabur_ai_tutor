import { z } from "zod";
import { recommendMaterials } from "../materials";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  keyword: z
    .string()
    .max(100)
    .optional()
    .describe("搜尋關鍵字（科目、章節、主題）"),
  limit: z.number().int().min(1).max(20).default(5).describe("推薦數量上限"),
});

export const recommendMaterialsTool = {
  name: "recommend_materials",
  description:
    "根據學生已加入的班級，推薦相關教材。適合學生詢問某主題有什麼資源可看時使用。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args, context) => {
    const parsed = inputSchema.parse(args);
    const materials = await recommendMaterials({
      studentId: context.userId,
      keyword: parsed.keyword,
      limit: parsed.limit,
    });
    if (materials.length === 0) return "目前沒有找到相關教材。";
    return JSON.stringify(materials, null, 2);
  },
} satisfies AiToolDefinition;
